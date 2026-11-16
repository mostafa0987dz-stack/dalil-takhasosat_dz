import type { AcceptanceRate } from "@/lib/universities";

/** جدول الشعب × السنوات لمعدلات جامعة وتخصص واحد (السنوات من الأحدث إلى الأقدم). */
export function pivotRates(rates: AcceptanceRate[]) {
  const years = Array.from(new Set(rates.map((r) => r.year))).sort((a, b) => b - a);
  const branches = Array.from(new Set(rates.map((r) => r.bac_branch)));
  const cells = new Map(rates.map((r) => [`${r.bac_branch}|${r.year}`, r]));
  return { years, branches, get: (branch: string, year: number) => cells.get(`${branch}|${year}`) };
}

export const fmtScore = (v: number | string | null | undefined): string => (v === null || v === undefined ? "—" : Number(v).toFixed(2));
