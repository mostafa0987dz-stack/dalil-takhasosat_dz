import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ExternalLink, Globe, MapPin } from "lucide-react";
import { getUniversityBySlug, getUniversityRates, getUniversitySpecialties } from "@/lib/universities";
import { freshness, latestPerBranch } from "@/lib/rates";
import { getBacSeries } from "@/lib/series";
import { SITE_URL } from "@/lib/constants";
import UniversitySpecialties, { type UniSpecialtyView } from "@/components/UniversitySpecialties";
import ShareActions from "@/components/ShareActions";
import PrintSheet from "@/components/PrintSheet";
import JsonLd from "@/components/JsonLd";

export const revalidate = 600;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const u = await getUniversityBySlug(slug);
  if (!u) return {};
  return {
    title: `${u.name_ar} — التخصصات ومعدلات القبول`,
    description: `التخصصات المتوفرة في ${u.name_ar}${u.wilaya ? ` (${u.wilaya})` : ""} ومعدلات القبول حسب شعبة البكالوريا والسنة.`,
    alternates: { canonical: `/universities/${slug}` },
  };
}

export default async function UniversityPage({ params }: Props) {
  const { slug } = await params;
  const university = await getUniversityBySlug(slug);
  if (!university) notFound();
  const [specialties, rates, series] = await Promise.all([getUniversitySpecialties(university.id), getUniversityRates(university.id), getBacSeries()]);

  const bySpecialty = new Map<string, typeof rates>();
  for (const r of rates) bySpecialty.set(r.specialty_slug, [...(bySpecialty.get(r.specialty_slug) ?? []), r]);
  const items: UniSpecialtyView[] = specialties.map((s) => ({
    slug: s.specialty_slug, nom_ar: s.nom_ar, domaine: s.domaine, diplome: s.diplome, duree: s.duree, faculty: s.faculty_name,
    rates: latestPerBranch(bySpecialty.get(s.specialty_slug) ?? []).map((r) => ({ b: r.branch, y: r.year, s: r.score })),
  }));
  const present = new Set(items.flatMap((i) => i.rates.map((r) => r.b)));
  const branches = [...series.map((s) => s.name_ar).filter((n) => present.has(n)), ...[...present].filter((b) => !series.some((s) => s.name_ar === b))];
  const fresh = freshness(rates.map((r) => r.updated_at));
  const withRates = items.filter((i) => i.rates.length).length;

  const place = [university.type, university.wilaya, university.city].filter(Boolean).join(" · ");
  const mapHref = university.latitude !== null && university.longitude !== null
    ? `https://www.google.com/maps/search/?api=1&query=${university.latitude},${university.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([university.name_ar, university.wilaya, "الجزائر"].filter(Boolean).join(" "))}`;
  const pageUrl = `${SITE_URL}/universities/${slug}`;
  const MAX_PRINT = 35;
  const printRows = items.map((i) => {
    const min = i.rates.length ? Math.min(...i.rates.map((r) => r.s)) : null;
    const year = i.rates.length ? Math.max(...i.rates.map((r) => r.y)) : null;
    return [i.nom_ar, i.faculty ?? "—", min === null ? "—" : min.toFixed(2), year === null ? "—" : String(year)];
  });
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CollegeOrUniversity", name: university.name_ar, url: university.website_url ?? pageUrl,
    ...(university.name_fr ? { alternateName: university.name_fr } : {}),
    address: { "@type": "PostalAddress", addressCountry: "DZ", ...(university.wilaya ? { addressRegion: university.wilaya } : {}), ...(university.city ? { addressLocality: university.city } : {}), ...(university.address ? { streetAddress: university.address } : {}) },
  };

  return (
    <article className="container-page print-article max-w-6xl py-12">
      <JsonLd data={jsonLd} />
      <div className="no-print">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="مسار التنقل" className="flex flex-wrap items-center gap-2 text-sm text-blue-600">
            <Link href="/universities">الجامعات</Link><span aria-hidden>/</span><span className="text-slate-500">{university.name_ar}</span>
          </nav>
          <ShareActions title={university.name_ar} />
        </div>

        <header className="mb-8 rounded-3xl bg-gradient-to-bl from-blue-950 via-blue-800 to-indigo-700 p-8 text-white shadow-glass">
          <h1 className="text-3xl font-black md:text-4xl">{university.name_ar}</h1>
          {university.name_fr && <p dir="ltr" className="mt-1 text-right text-blue-100">{university.name_fr}</p>}
          {place && <p className="mt-4 flex items-center gap-1.5 text-blue-100"><MapPin size={16} aria-hidden />{place}</p>}
          {university.address && <p className="mt-1 text-sm text-blue-100">{university.address}</p>}
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            {university.website_url && <a className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 font-semibold backdrop-blur hover:bg-white/25" href={university.website_url} target="_blank" rel="noopener noreferrer"><Globe size={15} aria-hidden />الموقع الرسمي</a>}
            <a className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 font-semibold backdrop-blur hover:bg-white/25" href={mapHref} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden />الموقع على الخريطة</a>
          </div>
        </header>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="card !p-4"><b className="block text-2xl">{items.length}</b><span className="text-sm text-slate-500">تخصص متوفر</span></div>
          <div className="card !p-4"><b className="block text-2xl">{withRates}</b><span className="text-sm text-slate-500">تخصص له معدلات قبول</span></div>
          <div className="card !p-4"><b className="block text-2xl">{fresh?.label ?? "—"}</b><span className="text-sm text-slate-500">آخر تحديث للمعدلات</span></div>
        </div>
        {fresh?.stale && (
          <p role="note" className="mb-6 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm leading-7 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"><AlertTriangle size={18} className="mt-1 shrink-0" aria-hidden />مضى على آخر تحديث لمعدلات هذه الجامعة أكثر من 18 شهراً؛ قد تكون المعدلات الحالية مختلفة، فراجع المنشور الرسمي للجامعة.</p>
        )}

        {university.description_ar && <section className="card mb-8"><h2 className="mb-2 text-lg font-black">عن الجامعة</h2><p className="leading-8 text-slate-700 dark:text-slate-300">{university.description_ar}</p></section>}

        <section aria-labelledby="uni-specialties">
          <h2 id="uni-specialties" className="section-title mb-2">التخصصات في {university.name_ar}</h2>
          <p className="mb-5 text-slate-600 dark:text-slate-400">افتح أي تخصص لرؤية جدول معدلات القبول حسب الشعبة والسنة واتجاهها.</p>
          {items.length ? <UniversitySpecialties universitySlug={slug} items={items} branches={branches} /> : <p className="card text-slate-600 dark:text-slate-400">لم تُربط تخصصات بهذه الجامعة بعد.</p>}
        </section>
      </div>

      <PrintSheet
        title={university.name_ar}
        subtitle={place || undefined}
        facts={[
          ...(university.wilaya ? [{ label: "الولاية", value: university.wilaya }] : []),
          ...(university.website_url ? [{ label: "الموقع الرسمي", value: university.website_url.replace(/^https?:\/\//, "") }] : []),
          { label: "عدد التخصصات", value: String(items.length) },
        ]}
        table={{ title: "التخصصات وأدنى معدل قبول مسجل (من 20)", head: ["التخصص", "الكلية / المعهد", "أدنى معدل", "آخر سنة"], rows: printRows.slice(0, MAX_PRINT) }}
        note={printRows.length > MAX_PRINT ? `عُرض ${MAX_PRINT} تخصصاً من ${printRows.length}؛ البقية على الموقع` : undefined}
        url={pageUrl}
      />
    </article>
  );
}
