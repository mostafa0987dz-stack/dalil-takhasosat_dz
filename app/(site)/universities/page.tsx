import type { Metadata } from "next";
import { Building2, MapPin, GraduationCap } from "lucide-react";
import { getPublishedUniversities } from "@/lib/universities";
import UniversityCards from "@/components/UniversityCards";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "الجامعات الجزائرية والتخصصات المتوفرة في كل جامعة",
  description: "دليل الجامعات والمؤسسات الجامعية في الجزائر: الولاية والمدينة والموقع الرسمي والتخصصات التي تدرّسها كل جامعة ومعدلات القبول فيها.",
  alternates: { canonical: "/universities" },
};

export default async function UniversitiesPage() {
  const universities = await getPublishedUniversities();
  const wilayas = new Set(universities.map((u) => u.wilaya).filter(Boolean));
  const totalLinks = universities.reduce((n, u) => n + u.specialties_count, 0);
  return (
    <section className="container-page py-12">
      <header className="mb-8">
        <h1 className="section-title mb-3">الجامعات</h1>
        <p className="max-w-3xl leading-8 text-slate-600 dark:text-slate-400">اختر جامعة لترى معلوماتها والتخصصات المتوفرة فيها ومعدلات القبول لكل شعبة، وجرّب معدلك لمعرفة فرصك.</p>
        {universities.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="chip inline-flex items-center gap-2"><Building2 size={15} aria-hidden />{universities.length} جامعة</span>
            <span className="chip inline-flex items-center gap-2"><MapPin size={15} aria-hidden />{wilayas.size} ولاية</span>
            <span className="chip inline-flex items-center gap-2"><GraduationCap size={15} aria-hidden />{totalLinks} ربط بتخصص</span>
          </div>
        )}
      </header>
      {universities.length ? <UniversityCards items={universities} /> : <p className="card text-slate-600 dark:text-slate-400">لم تُنشر جامعات بعد. تُضاف الجامعات من لوحة الإدارة بملف JSON.</p>}
    </section>
  );
}
