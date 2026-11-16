import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpecialties, getSpecialty } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { getUniversitiesForSpecialty } from "@/lib/universities";
import { similarTo, toIsoDuration } from "@/lib/specialty";
import DomainIcon, { domainCls } from "@/components/DomainIcon";
import FavoriteButton from "@/components/FavoriteButton";
import ShareActions from "@/components/ShareActions";
import SpecialtyCard from "@/components/SpecialtyCard";
import SpecialtyTabs from "@/components/SpecialtyTabs";
import PrintSheet from "@/components/PrintSheet";
import UniversityCards from "@/components/UniversityCards";
import JsonLd from "@/components/JsonLd";
import { GitCompare } from "lucide-react";

export const revalidate = 600;

export async function generateStaticParams() {
  return (await getSpecialties()).map((x) => ({ slug: x.slug }));
}

const clip = (t: string, n = 155) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSpecialty(slug);
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

export default async function SpecialtyDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = await getSpecialties();
  const s = all.find((x) => x.slug === slug);
  if (!s) notFound();

  const similar = similarTo(s, all, 3);
  const universities = await getUniversitiesForSpecialty(s.slug);
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
      id: "unis", label: `الجامعات ومعدلات القبول${universities.length ? ` (${universities.length})` : ""}`,
      content: (
        <section>
          <p className="mb-4 max-w-3xl leading-8 text-slate-600 dark:text-slate-400">معدلات القبول مرتبطة بالجامعة وشعبة البكالوريا والسنة. اختر الجامعة لعرض جدول المعدلات ومصادره.</p>
          {universities.length ? (
            <UniversityCards items={universities} specialtySlug={s.slug} />
          ) : <p className="card text-slate-600 dark:text-slate-400">لم تُضف جامعات لهذا التخصص بعد.</p>}
        </section>
      ),
    },
  ];

  if (similar.length) {
    tabs.push({
      id: "similar", label: "تخصصات مشابهة",
      content: <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{similar.map((x) => <SpecialtyCard key={x.slug} item={x} />)}</div>,
    });
  }

  return (
    <article className="container-page print-article max-w-5xl py-12">
      <JsonLd data={jsonLd} />
      <div className="no-print">

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

      </div>

      <PrintSheet
        title={s.nom_ar}
        subtitle={s.nom_fr || undefined}
        facts={[
          { label: "المجال", value: s.domaine },
          { label: "الشهادة", value: s.diplome },
          { label: "المدة", value: s.duree },
          { label: "الشعب المؤهلة", value: s.filiere.join("، ") },
        ]}
        lists={[
          { title: "المهارات المكتسبة", items: s.competences, max: 6 },
          { title: "آفاق التوظيف", items: s.debouches, max: 6 },
          { title: "الجامعات", items: universities.map((u) => [u.name_ar, u.wilaya].filter(Boolean).join(" — ")), max: 12 },
        ]}
        url={pageUrl}
      />
    </article>
  );
}
