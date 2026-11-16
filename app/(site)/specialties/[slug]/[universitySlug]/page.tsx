import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpecialty } from "@/lib/data";
import { getAcceptanceRates, getUniversityForSpecialty } from "@/lib/universities";
import { fmtScore, freshness, pivotRates, trendOf } from "@/lib/rates";
import Sparkline from "@/components/Sparkline";
import { SITE_URL } from "@/lib/constants";
import PrintSheet from "@/components/PrintSheet";
import ShareActions from "@/components/ShareActions";
import { AlertTriangle, ArrowRight, BadgeCheck, MapPin } from "lucide-react";

export const revalidate = 900;

type Props = { params: Promise<{ slug: string; universitySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, universitySlug } = await params;
  const [specialty, university] = await Promise.all([
    getSpecialty(slug), getUniversityForSpecialty(slug, universitySlug),
  ]);
  if (!specialty || !university) return { title: "الصفحة غير موجودة", robots: { index: false } };
  return {
    title: `${specialty.nom_ar} في ${university.name_ar} | معدلات القبول`,
    description: `معدلات القبول التاريخية لتخصص ${specialty.nom_ar} في ${university.name_ar} حسب شعبة البكالوريا والسنة، مع مصادر البيانات المتاحة.`,
    alternates: { canonical: `/specialties/${slug}/${universitySlug}` },
  };
}

export default async function UniversitySpecialtyPage({ params }: Props) {
  const { slug, universitySlug } = await params;
  const [specialty, university] = await Promise.all([
    getSpecialty(slug), getUniversityForSpecialty(slug, universitySlug),
  ]);
  if (!specialty || !university) notFound();
  const rates = await getAcceptanceRates(slug, university.id);
  const { years, branches, get } = pivotRates(rates);
  const latestYear = years[0];
  const latestScores = rates.filter((r) => r.year === latestYear && r.score !== null).map((r) => Number(r.score));
  const sourced = rates.filter((r) => r.source_url || r.notes);
  const printYears = years.slice(0, 6);
  const fresh = freshness(rates.map((r) => r.updated_at));
  const pageUrl = `${SITE_URL}/specialties/${slug}/${universitySlug}`;
  const place = [university.type, university.wilaya, university.city].filter(Boolean).join(" · ");

  return (
    <div className="container-page print-article max-w-5xl py-12">
      <div className="no-print">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="مسار التنقل" className="flex flex-wrap items-center gap-2 text-sm text-blue-600">
            <Link href="/specialties">التخصصات</Link><span aria-hidden>/</span>
            <Link href={`/specialties/${slug}`}>{specialty.nom_ar}</Link><span aria-hidden>/</span>
            <span className="text-slate-500">{university.name_ar}</span>
          </nav>
          <ShareActions title={`${specialty.nom_ar} — ${university.name_ar}`} />
        </div>

        <header className="mb-8 rounded-3xl bg-gradient-to-bl from-blue-950 via-blue-800 to-indigo-700 p-8 text-white shadow-glass">
          <p className="text-sm text-blue-100">التخصص في الجامعة</p>
          <h1 className="my-2 text-3xl font-black">{specialty.nom_ar}</h1>
          <h2 className="text-xl font-bold">{university.name_ar}</h2>
          {place && <p className="mt-3 flex items-center gap-1.5 text-sm text-blue-100"><MapPin size={15} aria-hidden />{place}</p>}
          {university.website_url && <a className="mt-4 inline-block text-sm underline" href={university.website_url} target="_blank" rel="noopener noreferrer">الموقع الرسمي للجامعة</a>}
        </header>

        {rates.length > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="card !p-4"><b className="block text-2xl">{latestYear}</b><span className="text-sm text-slate-500">آخر سنة متوفرة</span></div>
            <div className="card !p-4"><b className="block text-2xl">{latestScores.length ? Math.min(...latestScores).toFixed(2) : "—"}</b><span className="text-sm text-slate-500">أدنى معدل في آخر سنة</span></div>
            <div className="card !p-4"><b className="block text-2xl">{branches.length}</b><span className="text-sm text-slate-500">شعبة مسجلة · {years.length} سنة</span></div>
          </div>
        )}

        <section className="card mb-6">
          <h2 className="mb-1 text-xl font-black">معدلات القبول حسب الشعبة والسنة</h2>
          <p className="mb-4 text-sm text-slate-500">كل خانة هي معدل القبول من 20. الشرطة (—) تعني أن المعدل غير متوفر.</p>
          {rates.length ? (
            <div className="table-wrap">
              <table className="w-full min-w-[28rem] text-center">
                <thead><tr className="bg-white/50 dark:bg-slate-800/40">
                  <th scope="col" className="th text-right">شعبة البكالوريا</th>
                  {years.map((y) => <th key={y} scope="col" className="th">{y}</th>)}
                  <th scope="col" className="th">الاتجاه</th>
                </tr></thead>
                <tbody>{branches.map((b) => (
                  <tr key={b} className="border-t border-slate-200/60 dark:border-slate-700/60">
                    <th scope="row" className="p-4 text-right font-bold">{b}</th>
                    {years.map((y) => {
                      const r = get(b, y);
                      return <td key={y} className="p-4">{r ? <span className={`inline-flex items-center gap-1 font-bold ${r.score === null ? "text-slate-400" : ""}`}>{fmtScore(r.score)}{r.is_official && <BadgeCheck size={14} className="text-emerald-600" aria-label="مصدر رسمي" />}</span> : <span className="text-slate-300">·</span>}</td>;
                    })}
                    {(() => {
                      const pts = years.map((y) => ({ year: y, score: get(b, y)?.score ?? null }));
                      const t = trendOf(pts);
                      const series = pts.filter((p): p is { year: number; score: number } => p.score !== null).map((p) => ({ year: p.year, score: Number(p.score) }));
                      return (
                        <td className="p-4">
                          <span className="inline-flex items-center gap-2">
                            <Sparkline points={series} label={`تطور معدل ${b}`} />
                            {t && <small className={`font-bold ${t.delta > 0 ? "text-rose-600" : t.delta < 0 ? "text-emerald-600" : "text-slate-500"}`} title={`مقارنة ${t.to} بـ ${t.from}`}>{t.delta > 0 ? "▲" : t.delta < 0 ? "▼" : "="} {Math.abs(t.delta).toFixed(2)}</small>}
                          </span>
                        </td>
                      );
                    })()}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="rounded-2xl bg-slate-100/70 p-5 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">لم تُسجل معدلات قبول موثقة لهذه الجامعة وهذا التخصص بعد.</p>}
          {rates.length > 1 && <p className="mt-3 text-xs text-slate-500">الاتجاه: الفرق بين أحدث سنتين متوفرتين. ▲ ارتفع الحد الأدنى (أصعب)، ▼ انخفض (أسهل).</p>}
          {rates.some((r) => r.is_official) && <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><BadgeCheck size={14} className="text-emerald-600" aria-hidden />تعني أن السجل مرتبط بمصدر رسمي موثق.</p>}
        </section>

        {fresh && (
          <p role="note" className={`mb-6 flex items-start gap-2 rounded-2xl p-4 text-sm leading-7 ${fresh.stale ? "bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200" : "bg-slate-100/70 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300"}`}>
            {fresh.stale && <AlertTriangle size={18} className="mt-1 shrink-0" aria-hidden />}
            <span>آخر تحديث لهذه المعدلات: {fresh.label}.{fresh.stale ? " مضى أكثر من 18 شهراً؛ راجع المنشور الرسمي للجامعة قبل الاعتماد عليها." : ""}</span>
          </p>
        )}

        {sourced.length > 0 && (
          <details className="card mb-6">
            <summary className="cursor-pointer font-black">المصادر والملاحظات ({sourced.length})</summary>
            <ul className="mt-4 space-y-3 text-sm">
              {sourced.map((r) => (
                <li key={r.id} className="border-t border-slate-200/60 pt-3 first:border-0 first:pt-0 dark:border-slate-700/60">
                  <b>{r.bac_branch} · {r.year}</b>
                  {r.source_url && <> — <a className="text-blue-600 underline" href={r.source_url} target="_blank" rel="noopener noreferrer">{r.source_title || "عرض المصدر"}</a></>}
                  {r.notes && <p className="mt-1 text-slate-500">{r.notes}</p>}
                </li>
              ))}
            </ul>
          </details>
        )}

        {university.description_ar && <section className="card mb-6"><h2 className="mb-2 text-lg font-black">عن الجامعة</h2><p className="leading-8">{university.description_ar}</p></section>}
        {university.address && <p className="mb-4 text-sm text-slate-500">العنوان: {university.address}</p>}
        <div className="flex flex-wrap gap-3"><Link className="btn-ghost" href={`/specialties/${slug}`}><ArrowRight size={16} aria-hidden />التخصص واختيار جامعة أخرى</Link><Link className="btn-ghost" href={`/universities/${universitySlug}`}>كل تخصصات {university.name_ar}</Link></div>
      </div>

      <PrintSheet
        title={specialty.nom_ar}
        subtitle={`${university.name_ar}${place ? ` — ${place}` : ""}`}
        table={{
          title: "معدلات القبول حسب الشعبة والسنة (من 20)",
          head: ["شعبة البكالوريا", ...printYears.map(String)],
          rows: branches.map((b) => [b, ...printYears.map((y) => { const r = get(b, y); return r ? `${fmtScore(r.score)}${r.is_official ? " ✓" : ""}` : "·"; })]),
        }}
        note={rates.some((r) => r.is_official) ? "✓ مصدر رسمي موثق" : undefined}
        url={pageUrl}
      />
    </div>
  );
}
