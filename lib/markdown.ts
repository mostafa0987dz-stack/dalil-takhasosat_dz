/**
 * محلل Markdown آمن: يُنتج شجرة كتل (لا HTML خام) يعرضها React، فلا مجال لحقن HTML/JS.
 * يدعم: عناوين (## ### ####)، فقرات، قوائم نقطية ورقمية، اقتباس، صور، فاصل، كود، وروابط/خط عريض/مائل/كود داخل السطر.
 */
export type Inline =
  | { t: "text"; v: string }
  | { t: "bold"; c: Inline[] }
  | { t: "italic"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; c: Inline[] };

export type Block =
  | { t: "heading"; level: 2 | 3 | 4; c: Inline[]; id: string }
  | { t: "paragraph"; c: Inline[] }
  | { t: "list"; ordered: boolean; items: Inline[][] }
  | { t: "quote"; c: Inline[] }
  | { t: "image"; src: string; alt: string }
  | { t: "code"; v: string }
  | { t: "hr" };

/** يقبل http(s) وmailto والمسارات الداخلية؛ يرفض javascript: وdata: وغيرها. */
export function safeUrl(raw: string, { allowMail = true } = {}): string | null {
  const u = raw.trim();
  if (!u || /[\s<>"']/.test(u)) return null;
  if (u.startsWith("/") && !u.startsWith("//")) return u;
  if (/^https?:\/\/[^\s]+$/i.test(u)) return u;
  if (allowMail && /^mailto:[^\s@]+@[^\s@]+$/i.test(u)) return u;
  return null;
}

export function slugifyHeading(text: string, used: Set<string>): string {
  const base = text.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "section";
  let id = base, n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let i = 0, buf = "";
  const flush = () => { if (buf) { out.push({ t: "text", v: buf }); buf = ""; } };
  while (i < src.length) {
    const rest = src.slice(i);
    let m: RegExpMatchArray | null;
    if ((m = rest.match(/^`([^`\n]+)`/))) { flush(); out.push({ t: "code", v: m[1] }); i += m[0].length; continue; }
    if ((m = rest.match(/^\*\*([^\n]+?)\*\*/))) { flush(); out.push({ t: "bold", c: parseInline(m[1]) }); i += m[0].length; continue; }
    if ((m = rest.match(/^(?:\*([^*\n]+?)\*|_([^_\n]+?)_)/))) { flush(); out.push({ t: "italic", c: parseInline(m[1] ?? m[2]) }); i += m[0].length; continue; }
    if ((m = rest.match(/^\[([^\]\n]+)\]\(([^)\s]+)\)/))) {
      const href = safeUrl(m[2]);
      flush();
      if (href) out.push({ t: "link", href, c: parseInline(m[1]) }); else out.push({ t: "text", v: m[1] }); // رابط غير آمن => نص فقط
      i += m[0].length; continue;
    }
    buf += src[i]; i++;
  }
  flush();
  return out;
}

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  const ids = new Set<string>();
  let para: string[] = [];
  const flushPara = () => { if (para.length) { blocks.push({ t: "paragraph", c: parseInline(para.join(" ")) }); para = []; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) {
      flushPara();
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      blocks.push({ t: "code", v: code.join("\n") });
      continue;
    }
    if (!line.trim()) { flushPara(); continue; }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/))) {
      flushPara();
      const level = Math.min(4, Math.max(2, m[1].length)) as 2 | 3 | 4; // h1 محجوز لعنوان المقال
      blocks.push({ t: "heading", level, c: parseInline(m[2]), id: slugifyHeading(m[2], ids) });
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { flushPara(); blocks.push({ t: "hr" }); continue; }
    if ((m = line.match(/^!\[([^\]\n]*)\]\(([^)\s]+)\)\s*$/))) {
      flushPara();
      const src = safeUrl(m[2], { allowMail: false });
      if (src) blocks.push({ t: "image", src, alt: m[1] });
      continue;
    }
    if (/^>\s?/.test(line)) { flushPara(); blocks.push({ t: "quote", c: parseInline(line.replace(/^>\s?/, "")) }); continue; }
    if (/^\s*([-*])\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      flushPara();
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: Inline[][] = [];
      while (i < lines.length && (ordered ? /^\s*\d+[.)]\s+/.test(lines[i]) : /^\s*[-*]\s+/.test(lines[i]))) {
        items.push(parseInline(lines[i].replace(ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/, "")));
        i++;
      }
      i--;
      blocks.push({ t: "list", ordered, items });
      continue;
    }
    para.push(line.trim());
  }
  flushPara();
  return blocks;
}

/** نص عادي (للمقتطفات وتقدير وقت القراءة). */
export function plainText(md: string): string {
  return md.replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[#>*_`\-]+/g, " ").replace(/\s+/g, " ").trim();
}
export const readingMinutes = (md: string): number => Math.max(1, Math.round(plainText(md).split(" ").filter(Boolean).length / 200));
