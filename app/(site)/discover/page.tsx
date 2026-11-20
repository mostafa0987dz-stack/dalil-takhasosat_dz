import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import DiscoverWizard from "@/components/DiscoverWizard";
import { getSpecialties } from "@/lib/data";
import { getBacSeries } from "@/lib/series";
import { getPublishedUniversities } from "@/lib/universities";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "اكتشف تخصصك — التخصصات المناسبة لشعبتك ومعدلك",
  description: "أجب عن أسئلة قصيرة (الشعبة، المعدل، المجالات، الولاية) لتعرف التخصصات والجامعات التي يكفيك فيها معدلك.",
  alternates: { canonical: `${SITE_URL}/discover` },
};

export default async function DiscoverPage() {
  const [series, specialties, universities] = await Promise.all([getBacSeries(), getSpecialties(), getPublishedUniversities()]);
  const domains = Array.from(new Set(specialties.map((s) => s.domaine))).sort((a, b) => a.localeCompare(b, "ar"));
  const wilayas = Array.from(new Set(universities.map((u) => u.wilaya).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "ar"));
  return (
    <section className="container-page py-12">
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: "اكتشف تخصصك" }]} />
      <h1 className="section-title mb-3">اكتشف تخصصك</h1>
      <p className="mb-8 max-w-3xl leading-8 text-slate-600 dark:text-slate-400">أربع خطوات قصيرة، ثم نعرض لك التخصصات والجامعات التي يكفيك فيها معدلك حسب آخر معدلات القبول المسجّلة.</p>
      <DiscoverWizard branches={series.map((s) => s.name_ar)} domains={domains} wilayas={wilayas} />
    </section>
  );
}
