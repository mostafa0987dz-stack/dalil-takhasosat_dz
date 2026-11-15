import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSpecialties } from "@/lib/data";
import { getBacSeries } from "@/lib/series";
import { getLocale } from "@/lib/i18n";
import SpecialtyCard from "@/components/SpecialtyCard";
export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ serie: string }> }): Promise<Metadata> { const { serie } = await params; const s=(await getBacSeries()).find(x=>x.slug===serie); return s ? {title:`تخصصات شعبة ${s.name_ar}`} : {}; }
export default async function BacPage({ params }: { params: Promise<{ serie: string }> }) {
 const { serie: slug } = await params; const [series, specialties, locale] = await Promise.all([getBacSeries(),getSpecialties(),getLocale()]); const serie=series.find(s=>s.slug===slug); if(!serie) notFound();
 const available=specialties.filter(x=>x.filiere.includes(serie.name_ar)); const name=locale==="fr"?(serie.name_fr||serie.name_ar):locale==="en"?(serie.name_en||serie.name_ar):serie.name_ar;
 return <section className="container-page py-12"><h1 className="section-title mb-3">{locale==="fr"?`Spécialités de la série ${name}`:locale==="en"?`Majors for ${name}`:`تخصصات شعبة ${name}`}</h1><p className="mb-8 text-slate-600 dark:text-slate-400">{locale==="fr"?"Spécialités associées à cette série dans le guide.":locale==="en"?"Majors associated with this stream in the guide.":"التخصصات المرتبطة بهذه الشعبة ضمن بيانات الدليل الحالية."}</p><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{available.map(x=><SpecialtyCard key={x.slug} item={x}/>)}</div>{!available.length&&<p className="py-12 text-center text-slate-600 dark:text-slate-400">{locale==="fr"?"Aucune spécialité enregistrée pour cette série.":locale==="en"?"No majors are registered for this stream yet.":"لا توجد تخصصات مسجلة لهذه الشعبة بعد."}</p>}</section>;
}
