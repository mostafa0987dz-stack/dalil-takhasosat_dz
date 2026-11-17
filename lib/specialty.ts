import type { Seuil, Specialty } from "@/types";

/** أحدث عتبة لشعبة معينة. */
export function seuilFor(s: Specialty, serie: string): Seuil | undefined {
  return s.seuils.filter((x) => x.serie === serie).sort((a, b) => b.annee - a.annee)[0];
}

/** أدنى عتبة معروفة للتخصص (للعرض في البطاقة). */
export function minSeuil(s: Specialty): number | null {
  const v = s.seuils.map((x) => x.moyenne).filter((x): x is number => x !== null);
  return v.length ? Math.min(...v) : null;
}

export function hasDemo(items: Specialty[]): boolean {
  return items.some((s) => s.seuils.some((x) => x.demo));
}

/** تخصصات مشابهة: نقاط حسب المجال والوسوم والشعب المشتركة. */
export function similarTo(s: Specialty, all: Specialty[], limit = 3): Specialty[] {
  return all
    .filter((x) => x.slug !== s.slug)
    .map((x) => {
      let score = x.domaine === s.domaine ? 3 : 0;
      score += x.tags.filter((t) => s.tags.includes(t)).length * 2;
      score += x.filiere.filter((f) => s.filiere.includes(f)).length * 0.5;
      return { x, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.x);
}

/** يحوّل نصاً مثل "3 سنوات لليسانس" أو "3 إلى 5 سنوات" إلى مدة ISO 8601 (لـ JSON-LD). */
export function toIsoDuration(text: string): string | undefined {
  const nums = (text.match(/[0-9٠-٩]+/g) ?? []).map((n) => Number(n.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))));
  if (!nums.length) return undefined;
  const n = Math.max(...nums);
  if (/شهر|أشهر|اشهر/.test(text)) return `P${n}M`;
  return `P${n}Y`;
}

/** جدول السنوات × الشعب لعتبات تخصص واحد. */
export function pivotSeuils(s: Specialty) {
  const years = Array.from(new Set(s.seuils.map((x) => x.annee))).sort((a, b) => b - a);
  const series = Array.from(new Set(s.seuils.map((x) => x.serie)));
  return { years, series, get: (serie: string, annee: number) => s.seuils.find((x) => x.serie === serie && x.annee === annee) };
}
