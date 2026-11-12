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
