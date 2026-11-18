import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "معدلات القبول حسب الجامعة والتخصص",
  description: "اختر التخصص ثم الجامعة لعرض معدلات القبول التاريخية حسب شعبة البكالوريا والسنة.",
  alternates: { canonical: `${SITE_URL}/seuils` },
};

export default function SeuilsPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <section className="card text-center">
        <h1 className="section-title mb-3">معدلات القبول حسب الجامعة</h1>
        <p className="mb-6 leading-8 text-slate-600 dark:text-slate-300">أصبحت معدلات القبول مرتبطة بالجامعة والتخصص وشعبة البكالوريا والسنة. ابدأ باختيار التخصص، ثم اختر الجامعة لعرض كل المعدلات التاريخية المتاحة.</p>
        <div className="flex flex-wrap justify-center gap-3"><Link href="/finder" className="btn-primary">أين أقبل بمعدلي؟</Link><Link href="/universities" className="btn-ghost">تصفح الجامعات</Link><Link href="/specialties" className="btn-ghost">تصفح التخصصات</Link></div>
      </section>
    </div>
  );
}
