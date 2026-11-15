/** تحويل التخصصات من/إلى CSV (UTF-8). القوائم تُفصل بـ " ; " والعتبات بالشكل: الشعبة|السنة|المعدل|ملاحظة */
export const CSV_COLUMNS = [
  "slug", "nom_ar", "nom_fr", "domaine", "diplome", "duree", "description_ar",
  "filiere", "competences", "debouches", "universites", "tags", "published", "seuils",
] as const;

const SEP = " ; ";
const clean = (s: string) => s.replace(/[;|]/g, "،").replace(/\s+/g, " ").trim();

function cell(v: string): string {
  // حماية من حقن الصيغ عند فتح الملف في Excel
  const safe = /^[=+@]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function specialtiesToCsv(rows: any[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const r of rows) {
    const seuils = (r.thresholds ?? r.seuils ?? [])
      .map((t: any) => [t.serie, t.annee, t.moyenne ?? "", clean(t.remarque ?? "")].join("|"))
      .join(SEP);
    const vals: string[] = [
      r.slug, r.nom_ar, r.nom_fr ?? "", r.domaine, r.diplome, r.duree, r.description_ar,
      ...["filiere", "competences", "debouches", "universites", "tags"].map((k) => (r[k] ?? []).map(clean).join(SEP)),
      r.published ? "1" : "0", seuils,
    ].map((v) => String(v ?? ""));
    lines.push(vals.map(cell).join(","));
  }
  return "\ufeff" + lines.join("\r\n");
}

/** قارئ CSV بسيط يدعم الاقتباس والأسطر داخل الخلايا. */
export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  const src = text.replace(/^\ufeff/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((x) => x !== "")) out.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x !== "")) out.push(row);
  return out;
}

export function csvToSpecialties(text: string): any[] {
  const [head, ...body] = parseCsv(text);
  if (!head) return [];
  const idx = (k: string) => head.map((h) => h.trim()).indexOf(k);
  const get = (r: string[], k: string) => {
    const v = (r[idx(k)] ?? "").trim();
    return /^'[=+@]/.test(v) ? v.slice(1) : v;
  };
  const list = (r: string[], k: string) => get(r, k).split(";").map((s) => s.trim()).filter(Boolean);
  return body.map((r) => ({
    slug: get(r, "slug"), nom_ar: get(r, "nom_ar"), nom_fr: get(r, "nom_fr"), domaine: get(r, "domaine"),
    diplome: get(r, "diplome"), duree: get(r, "duree"), description_ar: get(r, "description_ar"),
    filiere: list(r, "filiere"), competences: list(r, "competences"), debouches: list(r, "debouches"),
    universites: list(r, "universites"), tags: list(r, "tags"),
    seuils: list(r, "seuils").map((s) => {
      const p = s.split("|").map((x) => x.trim());
      return { serie: p[0], annee: Number(p[1]), moyenne: p[2] === "" || p[2] === undefined ? null : Number(p[2]), remarque: p[3] || null };
    }),
  }));
}
