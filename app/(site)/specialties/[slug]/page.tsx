import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpecialties, getSpecialty } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { getRatesForSpecialties, getUniversitiesForSpecialty } from "@/lib/universities";
import { latestMin, latestPerBranch, minByYear } from "@/lib/rates";
import { autoSpecialtyDescription } from "@/lib/autotext";
import { similarTo, toIsoDuration } from "@/lib/specialty";
import DomainIcon, { domainCls } from "@/components/DomainIcon";
import FavoriteButton from "@/components/FavoriteButton";
import ShareActions from "@/components/ShareActions";
import SpecialtyCard from "@/components/SpecialtyCard";
import SpecialtyTabs from "@/components/SpecialtyTabs";
import PrintSheet from "@/components/PrintSheet";
import UniversityCards from "@/components/UniversityCards";
import MiniTrendChart from "@/components/MiniTrendChart";
import ScoreWidget, { type ScoreItem } from "@/components/ScoreWidget";
import SpecialtyFaq, { type FaqItem } from "@/components/SpecialtyFaq";
import SpecialtyCompareTable, { type CompareCol } from "@/components/SpecialtyCompareTable";
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
  const compareSpecs = similar.slice(0, 3);
  const [universities, ratesAll] = await Promise.all([
    getUniversitiesForSpecialty(s.slug),
    getRatesForSpecialties([s.slug, ...compareSpecs.map((x) => x.slug)]),
  ]);
  const pageUrl = `${SITE_URL}/specialties/${s.slug}`;

  // معدلات هذا التخصص عبر الجامعات: للرسم والأسئلة الشائعة والوصف المولَّد
  const rates = ratesAll.filter((r) => r.specialty_slug === s.slug);
  const min = latestMin(rates);
  const description = s.description_ar.trim() || autoSpecialtyDescription(s, universities.length, min); // عرض فقط، لا يُحفظ
  const trendByBranch = Object.fromEntries(Array.from(new Set(rates.map((r) => r.bac_branch))).map((b) => [b, minByYear(rates, b, 6)]));

  // أداة «هل معدلي يكفي؟» (نطاق التخصص): أحدث معدل لكل شعبة في كل جامعة
  const widgetItems: ScoreItem[] = universities.flatMap((u) => {
    const own = latestPerBranch(rates.filter((r) => r.university_id === u.id));
    return own.length ? [{ key: u.id, label: u.name_ar, href: `/specialties/${s.slug}/${u.slug}`, rates: own.map((r) => ({ b: r.branch, y: r.year, s: r.score })) }] : [];
  });
  const widgetBranches = Array.from(new Set(rates.map((r) => r.bac_branch)));

  // أسئلة شائعة مُولَّدة من البيانات؛ السؤال بلا بيانات يُحذف
  const faq: FaqItem[] = [];
  if (min) faq.push({ q: `ما هو أدنى معدل قبول في ${s.nom_ar}؟`, a: `أدنى معدل قبول مسجّل في ${s.nom_ar} هو ${min.score.toFixed(2)} في ${min.year} (شعبة ${min.branch}) حسب أحدث بيانات الدليل، وتتغير المعدلات من سنة إلى أخرى.` });
  if (s.duree.trim()) faq.push({ q: `كم سنة دراسة ${s.nom_ar}؟`, a: `مدة الدراسة في ${s.nom_ar}: ${s.duree.trim()}.` });
  if (s.filiere.length) faq.push({ q: `ما الشعب المؤهلة لتخصص ${s.nom_ar}؟`, a: `الشعب المؤهلة لتخصص ${s.nom_ar}: ${s.filiere.join("، ")}.` });
  if (universities.length) faq.push({ q: `في كم جامعة يُدرَّس ${s.nom_ar}؟`, a: `يُدرَّس ${s.nom_ar} في ${universities.length} جامعة ضمن بيانات الدليل.` });

  const compareCols: CompareCol[] = [s, ...compareSpecs].map((x) => {
    const m = latestMin(ratesAll.filter((r) => r.specialty_slug === x.slug));
    return { slug: x.slug, nom_ar: x.nom_ar, duree: x.duree, diplome: x.diplome, filiere: x.filiere, min: m ? { score: m.score, year: m.year } : null };
  });
  const extraLd: Record<string, unknown>[] = [];
  if (faq.length) extraLd.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  if (similar.length) extraLd.push({ "@context": "https://schema.org", "@type": "ItemList", name: `تخصصات مشابهة لـ ${s.nom_ar}`, itemListElement: similar.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.nom_ar, url: `${SITE_URL}/specialties/${x.slug}` })) });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOccupationalProgram",
      name: s.nom_ar,
      alternateName: s.nom_fr || undefined,
      description,
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
          <p className="leading-9 text-slate-700 dark:text-slate-300">{description}</p>
          {s.subjects && s.subjects.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-black">المواد الأساسية</h3>
              <ul className="flex flex-wrap gap-2">{s.subjects.map((x) => <li key={x} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">{x}</li>)}</ul>
            </div>
          )}
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
          {Object.keys(trendByBranch).length > 0 && <MiniTrendChart byBranch={trendByBranch} defaultBranch="علوم تجريبية" />}
          <ScoreWidget scope="specialty" items={widgetItems} branches={widgetBranches} />
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
      content: (
        <div className="space-y-8">
          <SpecialtyCompareTable cols={compareCols} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{similar.map((x) => <SpecialtyCard key={x.slug} item={x} />)}</div>
        </div>
      ),
    });
  }

  return (
    <article className="container-page print-article max-w-5xl py-12">
      <JsonLd data={[...jsonLd, ...extraLd]} />
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

      <SpecialtyFaq items={faq} />

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
