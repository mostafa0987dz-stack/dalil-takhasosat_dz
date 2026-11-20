/**
 * قارئ ZIP صغير بلا مكتبات (يعمل في Workers وNode عبر DecompressionStream).
 * يدعم الطريقتين stored وdeflate فقط؛ يرفض: التشفير، zip64، المسارات الخطرة، الملفات غير JSON، وأي تجاوز للحدود.
 */
export type ZipEntry = { name: string; data: Uint8Array };
export type ZipLimits = { maxZipBytes: number; maxEntries: number; maxFileBytes: number; maxTotalBytes: number };
export const ZIP_LIMITS: ZipLimits = { maxZipBytes: 25 * 1024 * 1024, maxEntries: 50, maxFileBytes: 10 * 1024 * 1024, maxTotalBytes: 30 * 1024 * 1024 };

export class ZipError extends Error {}

const ALLOWED_EXT = [".json"];
const IGNORED = (n: string) => n.startsWith("__MACOSX/") || n.endsWith(".DS_Store") || n.endsWith("Thumbs.db");

/** اسم داخل الأرشيف آمن؟ (لا مسار مطلق ولا .. ولا \ ولا محارف تحكم). */
export function checkEntryName(name: string): string | null {
  if (!name || name.length > 200) return "اسم ملف غير صالح داخل الأرشيف.";
  if (/[\u0000-\u001f\\]/.test(name)) return `اسم ملف غير آمن: ${name}`;
  if (name.startsWith("/") || /^[a-zA-Z]:/.test(name)) return `مسار مطلق غير مسموح: ${name}`;
  if (name.split("/").some((seg) => seg === ".." || seg === ".")) return `مسار خطر (..) غير مسموح: ${name}`;
  return null;
}

const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function inflateRaw(data: Uint8Array, cap: number): Promise<Uint8Array> {
  const stream = new Blob([data as unknown as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > cap) { await reader.cancel(); throw new ZipError("حجم ملف بعد فك الضغط يتجاوز الحد المسموح."); }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

export async function readZip(buf: Uint8Array, limits: ZipLimits = ZIP_LIMITS): Promise<ZipEntry[]> {
  if (buf.length > limits.maxZipBytes) throw new ZipError("حجم ملف ZIP يتجاوز الحد المسموح.");
  if (buf.length < 22) throw new ZipError("ملف ZIP غير صالح.");
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  // نهاية السجل المركزي (EOCD)
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
  if (eocd < 0) throw new ZipError("ملف ZIP غير صالح (لا يوجد سجل مركزي).");
  const count = dv.getUint16(eocd + 10, true);
  const cdSize = dv.getUint32(eocd + 12, true);
  const cdOffset = dv.getUint32(eocd + 16, true);
  if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) throw new ZipError("ZIP64 غير مدعوم.");
  if (count > limits.maxEntries) throw new ZipError(`عدد الملفات في الأرشيف يتجاوز ${limits.maxEntries}.`);
  if (cdOffset + cdSize > buf.length) throw new ZipError("ملف ZIP تالف.");

  const td = new TextDecoder("utf-8", { fatal: false });
  const out: ZipEntry[] = [];
  const seen = new Set<string>();
  let total = 0, p = cdOffset;
  for (let i = 0; i < count; i++) {
    if (p + 46 > buf.length || dv.getUint32(p, true) !== 0x02014b50) throw new ZipError("ملف ZIP تالف (سجل مركزي).");
    const flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true), crc = dv.getUint32(p + 16, true);
    const csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), commentLen = dv.getUint16(p + 32, true);
    const localOff = dv.getUint32(p + 42, true);
    const name = td.decode(buf.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith("/")) continue; // مجلد
    const bad = checkEntryName(name);
    if (bad) throw new ZipError(bad);
    if (IGNORED(name)) continue;
    if (seen.has(name)) throw new ZipError(`اسم ملف مكرر في الأرشيف: ${name}`);
    seen.add(name);
    const lower = name.toLowerCase();
    if (!ALLOWED_EXT.some((e) => lower.endsWith(e))) throw new ZipError(`نوع ملف غير مسموح داخل الأرشيف (JSON فقط): ${name}`);
    if (flags & 1) throw new ZipError(`ملف مشفّر غير مدعوم: ${name}`);
    if (csize === 0xffffffff || usize === 0xffffffff) throw new ZipError("ZIP64 غير مدعوم.");
    if (usize > limits.maxFileBytes) throw new ZipError(`الملف ${name} يتجاوز ${Math.round(limits.maxFileBytes / 1048576)} ميغابايت.`);
    total += usize;
    if (total > limits.maxTotalBytes) throw new ZipError("مجموع أحجام الملفات يتجاوز الحد المسموح.");

    if (localOff + 30 > buf.length || dv.getUint32(localOff, true) !== 0x04034b50) throw new ZipError(`ملف ZIP تالف (${name}).`);
    const start = localOff + 30 + dv.getUint16(localOff + 26, true) + dv.getUint16(localOff + 28, true);
    if (start + csize > buf.length) throw new ZipError(`ملف ZIP تالف (${name}).`);
    const raw = buf.subarray(start, start + csize);
    let data: Uint8Array;
    if (method === 0) data = raw.slice();
    else if (method === 8) data = await inflateRaw(raw, limits.maxFileBytes);
    else throw new ZipError(`طريقة ضغط غير مدعومة في ${name}.`);
    if (data.length !== usize) throw new ZipError(`حجم غير متطابق في ${name}.`);
    if (crc32(data) !== crc) throw new ZipError(`فحص السلامة (CRC) فشل في ${name}.`);
    out.push({ name, data });
  }
  return out;
}
