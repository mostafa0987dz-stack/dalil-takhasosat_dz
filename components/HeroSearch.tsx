"use client";
import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { norm } from "@/lib/text";

type Item = { slug: string; nom_ar: string; nom_fr: string };

export default function HeroSearch({ items }: { items: Item[] }) {
  const [q, setQ] = useState("");
  const n = norm(q);
  const hits = n ? items.filter((x) => norm(`${x.nom_ar} ${x.nom_fr}`).includes(n)).slice(0, 5) : [];
  return (
    <div className="relative max-w-xl">
      <form action="/specialties" className="flex gap-2 rounded-2xl bg-white p-2">
        <input
          name="q" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off"
          aria-label="ابحث عن تخصص" placeholder="ابحث عن تخصص..."
          className="min-w-0 flex-1 rounded-xl px-3 text-slate-900 outline-none"
        />
        <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"><Search size={18} />بحث</button>
      </form>
      {hits.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-2xl bg-white text-slate-900 shadow-xl">
          {hits.map((x) => (
            <li key={x.slug}>
              <Link href={`/specialties/${x.slug}`} className="flex justify-between px-4 py-3 hover:bg-blue-50">
                <b>{x.nom_ar}</b><span dir="ltr" className="text-sm text-slate-500">{x.nom_fr}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
