import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSpecialties } from "@/lib/data";
import { SERIES } from "@/lib/constants";
import SpecialtyCard from "@/components/SpecialtyCard";

export const revalidate = 600;

export function generateStaticParams() {
  return SERIES.map((s) => ({ serie: s.slug }));
}

export function generateMetadata({ params }: { params: { serie: string } }): Metadata {
  const s = SERIES.find((x) => x.slug === params.serie);
  return s ? { title: `تخصصات شعبة ${s.name}` } : {};
}

export default async function BacPage({ params }: { params: { serie: string } }) {
  const serie = SERIES.find((x) => x.slug === params.serie);
  if (!serie) notFound();
  const available = (await getSpecialties()).filter((x) => x.filiere.includes(serie.name));
  return (
    <section className="container-page py-12">
      <h1 className="section-title mb-3">تخصصات شعبة {serie.name}</h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">التخصصات المرتبطة بهذه الشعبة ضمن بيانات الدليل الحالية.</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{available.map((x) => <SpecialtyCard key={x.slug} item={x} />)}</div>
      {!available.length && <p className="py-12 text-center text-slate-600 dark:text-slate-400">لا توجد تخصصات مسجلة لهذه الشعبة بعد.</p>}
    </section>
  );
}
