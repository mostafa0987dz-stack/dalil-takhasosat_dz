"use client";
import Link from "next/link";
import type { Specialty } from "@/types";
import { useFavorites } from "@/lib/useFavorites";
import SpecialtyCard from "./SpecialtyCard";

export default function FavoritesClient({ items }: { items: Specialty[] }) {
  const { fav } = useFavorites();
  const list = items.filter((x) => fav.includes(x.slug));
  return (
    <section className="container-page py-12">
      <h1 className="section-title mb-3">تخصصاتي المفضلة</h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">تُحفظ المفضلة في متصفحك فقط.</p>
      {list.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((x) => <SpecialtyCard key={x.slug} item={x} />)}</div>
      ) : (
        <div className="py-16 text-center">
          <p className="mb-4 text-slate-600 dark:text-slate-400">لم تضف أي تخصص بعد. اضغط على القلب في بطاقة التخصص.</p>
          <Link href="/specialties" className="btn-primary">تصفح التخصصات</Link>
        </div>
      )}
    </section>
  );
}
