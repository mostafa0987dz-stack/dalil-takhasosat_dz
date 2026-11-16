import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpecialty } from "@/lib/data";
import { getAcceptanceRates, getUniversityForSpecialty } from "@/lib/universities";

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
  const branches = Array.from(new Set(rates.map((r) => r.bac_branch)));
  const years = Array.from(new Set(rates.map((r) => r.year))).sort((a, b) => a - b);

  return (
    <main className="container-page max-w-5xl py-12">
      <nav className="mb-6 flex flex-wrap gap-2 text-sm text-blue-600">
        <Link href="/specialties">التخصصات</Link><span>/</span>
        <Link href={`/specialties/${slug}`}>{specialty.nom_ar}</Link><span>/</span>
        <span className="text-slate-500">{university.name_ar}</span>
      </nav>
      <header className="print-hero mb-8 rounded-3xl bg-gradient-to-bl from-blue-950 via-blue-800 to-indigo-700 p-8 text-white shadow-glass">
        <p className="text-sm text-blue-100">التخصص في الجامعة</p>
        <h1 className="my-2 text-3xl font-black">{specialty.nom_ar}</h1>
        <h2 className="text-xl font-bold">{university.name_ar}</h2>
        <p className="mt-2 text-sm text-blue-100">{[university.type, university.wilaya, university.city].filter(Boolean).join(" · ")}</p>
        {university.website_url && <a className="mt-4 inline-block underline" href={university.website_url} target="_blank" rel="noopener noreferrer">الموقع الرسمي للجامعة</a>}
      </header>

      <section className="card mb-6">
        <h2 className="mb-2 text-xl font-black">معدلات القبول حسب الشعبة والسنة</h2>
        <p className="mb-4 text-sm text-slate-500">لا يوجد حد أقصى لعدد السنوات. لا تُعرض قيمة غير موثقة كمعدل فعلي، وكل سجل يتضمن مصدره عند توفره.</p>
        {rates.length ? (
          <div className="table-wrap">
            <table className="w-full min-w-[36rem] text-right">
              <thead><tr className="bg-white/50 dark:bg-slate-800/40"><th className="th">شعبة البكالوريا</th><th className="th">السنة</th><th className="th">معدل القبول</th><th className="th">المصدر</th></tr></thead>
              <tbody>{rates.map((r) => (
                <tr key={r.id} className="border-t border-slate-200/60 dark:border-slate-700/60">
                  <td className="p-4">{r.bac_branch}</td><td className="p-4">{r.year}</td>
                  <td className="p-4 font-bold">{r.score === null ? "غير متوفر" : `${r.score.toFixed(2)} / 20`}</td>
                  <td className="p-4 text-sm">{r.source_url ? <a className="text-blue-600 underline" href={r.source_url} target="_blank" rel="noopener noreferrer">{r.source_title || "عرض المصدر"}</a> : <span className="text-slate-400">لا يوجد مصدر مسجل</span>}{r.is_official && <span className="mr-2 text-xs text-emerald-700">رسمي</span>}{r.notes && <p className="mt-1 text-xs text-slate-500">{r.notes}</p>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="rounded-2xl bg-slate-100/70 p-5 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">لم تُسجل معدلات قبول موثقة لهذه الجامعة وهذا التخصص بعد. ستظهر البيانات هنا عند إضافتها من مصدر موثوق.</p>}
      </section>

      {university.description_ar && <section className="card mb-6"><h2 className="mb-2 text-lg font-black">عن الجامعة</h2><p className="leading-8">{university.description_ar}</p></section>}
      {university.address && <p className="mb-4 text-sm text-slate-500">العنوان: {university.address}</p>}
      <Link className="btn-ghost" href={`/specialties/${slug}`}>العودة إلى التخصص واختيار جامعة أخرى</Link>
    </main>
  );
}
