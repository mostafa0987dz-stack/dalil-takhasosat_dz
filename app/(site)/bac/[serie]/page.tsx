import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSpecialties } from "@/lib/data";
import { getBacSeries } from "@/lib/series";
import SpecialtyCard from "@/components/SpecialtyCard";
export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ serie: string }> }): Promise<Metadata> { const { serie } = await params; const s=(await getBacSeries()).find(x=>x.slug===serie); return s ? {title:`تخصصات شعبة ${s.name_ar}`} : {}; }
export default async function BacPage({ params }: { params: Promise<{ serie: string }> }) {
 const { serie: slug } = await params; const [series, specialties] = await Promise.all([getBacSeries(),getSpecialties()]); const serie=series.find(s=>s.slug===slug); if(!serie) notFound();
 const available=specialties.filter(x=>x.filiere.includes(serie.name_ar)); const name=serie.name_ar;
 return <section className="container-page py-12"><h1 className="section-title mb-3">تخصصات شعبة {name}</h1><p className="mb-8 text-slate-600 dark:text-slate-400">التخصصات المرتبطة بهذه الشعبة ضمن بيانات الدليل الحالية.</p><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{available.map(x=><SpecialtyCard key={x.slug} item={x}/>)}</div>{!available.length&&<p className="py-12 text-center text-slate-600 dark:text-slate-400">لا توجد تخصصات مسجلة لهذه الشعبة بعد.</p>}</section>;
}
