import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "معدلات القبول حسب الجامعة والتخصص",
  description: "اختر التخصص ثم الجامعة لعرض معدلات القبول التاريخية حسب شعبة البكالوريا والسنة.",
  alternates: { canonical: "/seuils" },
};

export default function SeuilsPage() {
  return (
    <main className="container-page max-w-3xl py-16">
      <section className="card text-center">
        <h1 className="section-title mb-3">معدلات القبول حسب الجامعة</h1>
        <p className="mb-6 leading-8 text-slate-600 dark:text-slate-300">أصبحت معدلات القبول مرتبطة بالجامعة والتخصص وشعبة البكالوريا والسنة. ابدأ باختيار التخصص، ثم اختر الجامعة لعرض كل المعدلات التاريخية المتاحة.</p>
        <Link href="/specialties" className="btn-primary">تصفح التخصصات واختيار الجامعة</Link>
      </section>
    </main>
  );
}
