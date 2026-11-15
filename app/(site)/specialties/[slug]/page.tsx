import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GitCompare, MapPin } from "lucide-react";
import { getSpecialties, getSpecialty } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { groupByRegion } from "@/lib/geo";
import { pivotSeuils, similarTo, toIsoDuration } from "@/lib/specialty";
import DomainIcon, { domainCls } from "@/components/DomainIcon";
import DemoNotice from "@/components/DemoNotice";
import FavoriteButton from "@/components/FavoriteButton";
import ShareActions from "@/components/ShareActions";
import SpecialtyCard from "@/components/SpecialtyCard";
import SpecialtyTabs from "@/components/SpecialtyTabs";
import JsonLd from "@/components/JsonLd";

export const revalidate = 600;

export async function generateStaticParams() {
  return (await getSpecialties()).map((x) => ({ slug: x.slug }));
}

const clip = (t: string, n = 155) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await getSpecialty(params.slug);
  if (!s) return { title: "التخصص غير موجود", robots: { index: false } };
  const title = `تخصص ${s.nom_ar} في الجزائر: عتبات القبول والآفاق`;
  const description = clip(`${s.nom_ar} (${s.nom_fr}) — ${s.diplome}، ${s.duree}. ${s.description_ar}`);
  const url = `/specialties/${s.slug}`;
  return {
    title,
    description,
    keywords: [s.nom_ar, s.nom_fr, `تخصص ${s.nom_ar}`, `عتبة ${s.nom_ar}`, "توجيه جامعي الجزائر", ...s.tags].filter(Boolean),
    alternates: { canonical: url },
    openGraph: { type: "article", locale: "ar_DZ", siteName: SITE_NAME, title, description, url },
    twitter: { card: "summary", title, description },
  };
}

export default async function SpecialtyDetails({ params }: { params: { slug: string } }) {
  const all = await getSpecialties();
  const s = all.find((x) => x.slug === params.slug);
  if (!s) notFound();

  const similar = similarTo(s, all, 3);
  const demo = s.seuils.some((x) => x.demo);
  const pv = pivotSeuils(s);
  const regions = groupByRegion(s.universites);
  const pageUrl = `${SITE_URL}/specialties/${s.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOccupationalProgram",
      name: s.nom_ar,
      alternateName: s.nom_fr || undefined,
      description: s.description_ar,
      url: pageUrl,
      inLanguage: "ar",
      timeToComplete: toIsoDuration(s.duree),
      occupationalCredentialAwarded: s.diplome,
      programPrerequisites: `بكالوريا: ${s.filiere.join("، ")}`,
      educationalProgramMode: "full-time",
      keywords: s.tags.join(", ") || undefined,
      teaches: s.competences,
      occupationalCategory: s.debouches,
      provider: s.universites.map((u) => ({ "@type": "CollegeOrUniversity", name: u, address: { "@type": "PostalAddress", addressCountry: "DZ" } })),
      dateModified: s.updated_at,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "التخصصات", item: `${SITE_URL}/specialties` },
        { "@type": "ListItem", position: 3, name: s.nom_ar, item: pageUrl },
      ],
    },
  ];

  const list = (items: string[]) => <ul className="list-inside list-disc space-y-3 text-slate-700 dark:text-slate-300">{items.map((x) => <li key={x}>{x}</li>)}</ul>;

  const tabs = [
    {
      id: "about", label: "نبذة",
      content: (
        <section className="card">
          <p className="leading-9 text-slate-700 dark:text-slate-300">{s.description_ar}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-white/50 p-4 dark:bg-slate-800/40"><dt className="text-slate-500">الشهادة</dt><dd className="mt-1 font-bold">{s.diplome}</dd></div>
            <div className="rounded-2xl bg-white/50 p-4 dark:bg-slate-800/40"><dt className="text-slate-500">المدة</dt><dd className="mt-1 font-bold">{s.duree}</dd></div>
            <div className="rounded-2xl bg-white/50 p-4 dark:bg-slate-800/40"><dt className="text-slate-500">الشعب المؤهلة</dt><dd className="mt-1 font-bold">{s.filiere.join("، ")}</dd></div>
          </dl>
        </section>
      ),
    },
    {
      id: "skills", label: "المهارات والآفاق",
      content: (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="card"><h3 className="mb-4 text-xl font-black">المهارات المكتسبة</h3>{list(s.competences)}</section>
          <section className="card"><h3 className="mb-4 text-xl font-black">آفاق التوظيف</h3>{list(s.debouches)}</section>
        </div>
      ),
    },
    {
      id: "seuils", label: "عتبات القبول",
      content: (
        <section>
          {demo && <DemoNotice />}
          {pv.years.length ? (
            <div className="table-wrap">
              <table className="w-full min-w-[28rem] text-right">
                <caption className="sr-only">عتبات القبول في {s.nom_ar} حسب الشعبة والسنة</caption>
                <thead className="bg-white/50 dark:bg-slate-800/40">
                  <tr>
                    <th scope="col" className="th">الشعبة</th>
                    {pv.years.map((y) => <th key={y} scope="col" className="th">{y}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {pv.series.map((serie) => (
                    <tr key={serie} className="border-t border-slate-200/60 dark:border-slate-700/60">
                      <th scope="row" className="p-4 text-sm font-bold">{serie}</th>
                      {pv.years.map((y) => {
                        const t = pv.get(serie, y);
                        return (
                          <td key={y} className="p-4" title={t?.remarque ?? undefined}>
                            {t ? <span className="font-bold">{t.moyenne !== null ? t.moyenne.toFixed(2) : "غير متوفر"}</span> : <span className="text-slate-400">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-slate-600 dark:text-slate-400">لا توجد عتبات مسجلة لهذا التخصص بعد.</p>}
          <p className="mt-3 text-xs text-slate-500">مرّر المؤشر فوق الرقم لعرض ملاحظة العتبة. تحقق دائماً من المنشور الرسمي.</p>
        </section>
      ),
    },
    {
      id: "unis", label: "الجامعات",
      content: regions.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {regions.map(({ region, items }) => (
            <section key={region} className="card">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><MapPin size={18} className="text-blue-600" aria-hidden />{region}</h3>
              <ul className="flex flex-wrap gap-2">{items.map((u) => <li key={u} className="rounded-2xl bg-white/60 px-4 py-2 text-sm dark:bg-slate-800/50">{u}</li>)}</ul>
            </section>
          ))}
        </div>
      ) : <p className="text-slate-600 dark:text-slate-400">لم تُسجَّل جامعات لهذا التخصص بعد.</p>,
    },
  ];

  if (similar.length) {
    tabs.push({
      id: "similar", label: "تخصصات مشابهة",
      content: <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{similar.map((x) => <SpecialtyCard key={x.slug} item={x} />)}</div>,
    });
  }

  return (
    <article className="container-page max-w-5xl py-12">
      <JsonLd data={jsonLd} />

      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/specialties" className="text-sm font-bold text-blue-600">← العودة إلى التخصصات</Link>
        <ShareActions title={s.nom_ar} />
      </div>

      <div className="print-hero mb-8 rounded-3xl border border-white/20 bg-gradient-to-bl from-blue-950 via-blue-800 to-indigo-700 p-8 text-white shadow-glass">
        <div className="flex items-start justify-between gap-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${domainCls(s.domaine)}`}><DomainIcon domaine={s.domaine} size={16} />{s.domaine}</span>
          <FavoriteButton slug={s.slug} className="no-print bg-white/10 !text-white hover:!bg-white/20" />
        </div>
        <h1 className="my-3 text-3xl font-black md:text-4xl">{s.nom_ar}</h1>
        <p className="text-blue-100">{s.nom_fr} · {s.diplome} · {s.duree}</p>
      </div>

      <SpecialtyTabs tabs={tabs} />

      <div className="no-print mt-8 flex flex-wrap gap-3">
        <Link href={`/calculator?specialty=${s.slug}`} className="btn-primary">احسب معدلي لهذا التخصص</Link>
        <Link href={`/compare?s=${s.slug}`} className="btn-ghost"><GitCompare size={16} />قارن مع تخصصات أخرى</Link>
      </div>

      <p className="print-only mt-6 text-xs">المصدر: {pageUrl} — البيانات إرشادية؛ المرجع النهائي منشور وزارة التعليم العالي.</p>
    </article>
  );
}
