import type { AcceptanceRate } from "@/lib/universities";

/** جدول الشعب × السنوات لمعدلات جامعة وتخصص واحد (السنوات من الأحدث إلى الأقدم). */
export function pivotRates(rates: AcceptanceRate[]) {
  const years = Array.from(new Set(rates.map((r) => r.year))).sort((a, b) => b - a);
  const branches = Array.from(new Set(rates.map((r) => r.bac_branch)));
  const cells = new Map(rates.map((r) => [`${r.bac_branch}|${r.year}`, r]));
  return { years, branches, get: (branch: string, year: number) => cells.get(`${branch}|${year}`) };
}

export const fmtScore = (v: number | string | null | undefined): string => (v === null || v === undefined ? "—" : Number(v).toFixed(2));

/** أحدث معدل غير فارغ لكل شعبة: [{branch, year, score}]. */
export function latestPerBranch(rates: { bac_branch: string; year: number; score: number | null }[]) {
  const best = new Map<string, { branch: string; year: number; score: number }>();
  for (const r of rates) {
    if (r.score === null) continue;
    const cur = best.get(r.bac_branch);
    if (!cur || r.year > cur.year) best.set(r.bac_branch, { branch: r.bac_branch, year: r.year, score: Number(r.score) });
  }
  return [...best.values()];
}

/** اتجاه شعبة: الفرق بين أحدث سنتين متوفرتين (موجب = ارتفع الحد الأدنى). */
export function trendOf(points: { year: number; score: number | null }[]): { delta: number; from: number; to: number } | null {
  const pts = points.filter((p) => p.score !== null).sort((a, b) => b.year - a.year);
  if (pts.length < 2) return null;
  return { delta: Math.round((Number(pts[0].score) - Number(pts[1].score)) * 100) / 100, from: pts[1].year, to: pts[0].year };
}

/** حداثة البيانات: تاريخ آخر تحديث، وهل مضى عليه أكثر من 18 شهراً. */
export function freshness(dates: (string | null | undefined)[]): { label: string; stale: boolean } | null {
  const times = dates.map((d) => (d ? new Date(d).getTime() : NaN)).filter((t) => Number.isFinite(t));
  if (!times.length) return null;
  const latest = Math.max(...times);
  const months = (Date.now() - latest) / (1000 * 60 * 60 * 24 * 30.4);
  return { label: new Date(latest).toLocaleDateString("ar-DZ", { year: "numeric", month: "long" }), stale: months > 18 };
}

type RateLike = { bac_branch: string; year: number; score: number | null };

/** أدنى معدل في أحدث سنة متوفرة (عبر كل الجامعات والشعب). */
export function latestMin(rates: RateLike[]): { year: number; score: number; branch: string } | null {
  const valid = rates.filter((r) => r.score !== null);
  if (!valid.length) return null;
  const year = Math.max(...valid.map((r) => r.year));
  const best = valid.filter((r) => r.year === year).reduce((a, b) => (Number(b.score) < Number(a.score) ? b : a));
  return { year, score: Number(best.score), branch: best.bac_branch };
}

/** تطور أدنى معدل (عبر الجامعات) لشعبة: آخر `limit` سنوات متوفرة، من الأقدم إلى الأحدث. */
export function minByYear(rates: RateLike[], branch: string, limit = 6): { year: number; score: number }[] {
  const byYear = new Map<number, number>();
  for (const r of rates) {
    if (r.bac_branch !== branch || r.score === null) continue;
    const v = Number(r.score);
    const cur = byYear.get(r.year);
    if (cur === undefined || v < cur) byYear.set(r.year, v);
  }
  return [...byYear.entries()].map(([year, score]) => ({ year, score })).sort((a, b) => b.year - a.year).slice(0, limit).sort((a, b) => a.year - b.year);
}

/** حالة معدل الطالب مقابل آخر معدل مسجّل: يكفي / قريب (ينقصه ≤ نقطة) / أعلى. */
export const ADMISSION_NEAR = 1;
export type AdmissionStatus = "ok" | "near" | "high";
export function admissionStatus(score: number, average: number): AdmissionStatus {
  return average >= score ? "ok" : score - average <= ADMISSION_NEAR ? "near" : "high";
}
