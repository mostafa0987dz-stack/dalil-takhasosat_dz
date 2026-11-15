import type { Metadata } from "next";
import Link from "next/link";
import { getSpecialties } from "@/lib/data";
import { getBacSeries } from "@/lib/series";
import { getLocale } from "@/lib/i18n";
export const revalidate = 600;
export const metadata: Metadata = { title: "تخصصات حسب شعبة البكالوريا" };
export default async function BacIndex() {
  const [items, series, locale] = await Promise.all([getSpecialties(), getBacSeries(), getLocale()]);
  return <section className="container-page py-12"><h1 className="section-title mb-3">{locale === "fr" ? "Spécialités par série du bac" : locale === "en" ? "Majors by baccalaureate stream" : "تخصصات حسب الشعبة"}</h1><p className="mb-8 text-slate-600 dark:text-slate-400">{locale === "fr" ? "Choisissez votre série pour voir les spécialités accessibles." : locale === "en" ? "Choose your stream to see available majors." : "اختر شعبتك لترى التخصصات المتاحة لك."}</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{series.map((s) => { const name = locale === "fr" ? (s.name_fr || s.name_ar) : locale === "en" ? (s.name_en || s.name_ar) : s.name_ar; return <Link key={s.slug} href={`/bac/${s.slug}`} className="card transition hover:-translate-y-1 hover:shadow-md"><h2 className="text-lg font-extrabold">{name}</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{items.filter((x) => x.filiere.includes(s.name_ar)).length} {locale === "fr" ? "spécialités" : locale === "en" ? "majors" : "تخصص"}</p></Link>; })}</div></section>;
}
