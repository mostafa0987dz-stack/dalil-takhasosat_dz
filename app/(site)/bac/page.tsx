import type { Metadata } from "next";
import Link from "next/link";
import { getSpecialties } from "@/lib/data";
import { SERIES } from "@/lib/constants";

export const revalidate = 600;
export const metadata: Metadata = { title: "تخصصات حسب شعبة البكالوريا" };

export default async function BacIndex() {
  const items = await getSpecialties();
  return (
    <section className="container-page py-12">
      <h1 className="section-title mb-3">تخصصات حسب الشعبة</h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">اختر شعبتك لترى التخصصات المتاحة لك.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERIES.map((s) => (
          <Link key={s.slug} href={`/bac/${s.slug}`} className="card transition hover:-translate-y-1 hover:shadow-md">
            <h2 className="text-lg font-extrabold">{s.name}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{items.filter((x) => x.filiere.includes(s.name)).length} تخصص</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
