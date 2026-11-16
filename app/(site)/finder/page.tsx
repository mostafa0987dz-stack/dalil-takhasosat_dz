import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { findAdmissions, getPublishedUniversities } from "@/lib/universities";
import { getBacSeries } from "@/lib/series";

export const metadata: Metadata = {
  title: "أين أقبل؟ اعرف التخصصات والجامعات المناسبة لمعدلك",
  description: "أدخل شعبتك ومعدلك في البكالوريا لتعرف التخصصات والجامعات التي يكفيك فيها المعدل حسب آخر معدلات القبول المسجلة.",
  alternates: { canonical: "/finder" },
};

type Props = { searchParams: Promise<{ b?: string; s?: string; w?: string }> };
const MAX_ROWS = 150;

export default async function FinderPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [series, universities] = await Promise.all([getBacSeries(), getPublishedUniversities()]);
  const wilayas = Array.from(new Set(universities.map((u) => u.wilaya).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "ar"));
  const branch = series.some((s) => s.name_ar === sp.b) ? (sp.b as string) : "";
  const average = Number((sp.s ?? "").replace(",", "."));
  const valid = Boolean(branch) && (sp.s ?? "").trim() !== "" && Number.isFinite(average) && average >= 0 && average <= 20;
  const wilaya = wilayas.includes(sp.w ?? "") ? (sp.w as string) : "";
  const results = valid ? await findAdmissions({ branch, average, wilaya: wilaya || undefined }) : [];
  const ok = results.filter((r) => r.status === "ok");
  const near = results.filter((r) => r.status === "near");

  const table = (rows: typeof results) => (
    <div className="table-wrap">
      <table className="w-full min-w-[32rem] text-right">
        <thead><tr className="bg-white/50 dark:bg-slate-800/40"><th scope="col" className="th">التخصص</th><th scope="col" className="th">الجامعة</th><th scope="col" className="th">الولاية</th><th scope="col" className="th text-center">آخر معدل</th></tr></thead>
        <tbody>{rows.slice(0, MAX_ROWS).map((r) => (
          <tr key={`${r.university_slug}|${r.specialty_slug}`} className="border-t border-slate-200/60 dark:border-slate-700/60">
            <td className="p-4 font-bold"><Link className="hover:text-blue-600" href={`/specialties/${r.specialty_slug}/${r.university_slug}`}>{r.specialty_name}</Link></td>
            <td className="p-4"><Link className="text-blue-600" href={`/universities/${r.university_slug}`}>{r.university_name}</Link></td>
            <td className="p-4 text-slate-500">{r.wilaya ?? "—"}</td>
            <td className="p-4 text-center font-bold">{r.score.toFixed(2)} <small className="font-normal text-slate-500">({r.year})</small></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  return (
    <section className="container-page max-w-5xl py-12">
      <h1 className="section-title mb-3">أين أقبل؟</h1>
      <p className="mb-8 max-w-3xl leading-8 text-slate-600 dark:text-slate-400">أدخل شعبتك ومعدلك لنعرض لك التخصصات والجامعات التي يكفيك فيها المعدل، حسب آخر معدل قبول مسجل لكل جامعة وتخصص.</p>

      <form method="get" action="/finder" className="card mb-8 grid gap-4 md:grid-cols-[1.3fr_9rem_1fr_auto] md:items-end">
        <label className="text-sm font-bold">شعبة البكالوريا
          <select name="b" required defaultValue={branch} className="input mt-1"><option value="">اختر الشعبة</option>{series.map((s) => <option key={s.slug} value={s.name_ar}>{s.name_ar}</option>)}</select>
        </label>
        <label className="text-sm font-bold">معدلك
          <input name="s" required inputMode="decimal" defaultValue={sp.s ?? ""} placeholder="مثال: 14.5" className="input mt-1" />
        </label>
        <label className="text-sm font-bold">الولاية (اختياري)
          <select name="w" defaultValue={wilaya} className="input mt-1"><option value="">كل الولايات</option>{wilayas.map((w) => <option key={w} value={w}>{w}</option>)}</select>
        </label>
        <button className="btn-primary"><Search size={16} aria-hidden />أظهر النتائج</button>
      </form>

      {sp.s !== undefined && !valid && <p role="alert" className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">اختر شعبتك وأدخل معدلاً بين 0 و20.</p>}

      {valid && (
        <div className="space-y-10" aria-live="polite">
          <p className="rounded-2xl bg-blue-50 p-4 text-sm leading-7 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
            شعبة «{branch}» بمعدل <b>{average.toFixed(2)}</b>{wilaya ? ` في ولاية ${wilaya}` : ""}: <b>{ok.length}</b> نتيجة يكفيك فيها المعدل و<b>{near.length}</b> قريبة (ينقصك نقطة أو أقل). المعدلات تتغير كل سنة، فاعتمدها كمؤشر وراجع المنشور الرسمي.
          </p>
          <div>
            <h2 className="mb-3 text-xl font-black">معدلك يكفي ({ok.length})</h2>
            {ok.length ? table(ok) : <p className="card text-slate-600 dark:text-slate-400">لا توجد نتائج مسجلة بهذا المعدل لهذه الشعبة بعد.</p>}
            {ok.length > MAX_ROWS && <p className="mt-2 text-xs text-slate-500">عُرضت أول {MAX_ROWS} نتيجة. استعمل فلتر الولاية لتضييق القائمة.</p>}
          </div>
          {near.length > 0 && (
            <div>
              <h2 className="mb-1 text-xl font-black">قريبة من معدلك ({near.length})</h2>
              <p className="mb-3 text-sm text-slate-500">ينقصك أقل من نقطة؛ قد تتغير الحدود هذه السنة.</p>
              {table(near)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
