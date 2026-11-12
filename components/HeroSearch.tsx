"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { norm } from "@/lib/text";

type Item = { slug: string; nom_ar: string; nom_fr: string };

export default function HeroSearch({ items }: { items: Item[] }) {
  const [q, setQ] = useState("");
  const n = norm(q);
  const hits = n ? items.filter((x) => norm(`${x.nom_ar} ${x.nom_fr}`).includes(n)).slice(0, 5) : [];

  return (
    <div className="relative max-w-xl z-40">
      <form 
        action="/specialties" 
        className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-blue-900/20"
      >
        <Search className="ml-2 text-slate-400" size={20} />
        
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          aria-label="ابحث عن تخصص"
          placeholder="ابحث عن تخصص..."
          className="min-w-0 flex-1 bg-transparent py-2 text-slate-900 outline-none placeholder:text-slate-400"
        />
        
        {q && (
          <button 
            type="button" 
            onClick={() => setQ("")} 
            className="p-2 text-slate-400 transition-colors hover:text-red-500"
            aria-label="مسح البحث"
          >
            <X size={18} />
          </button>
        )}

        {/* تم إزالة hidden sm:inline من هنا لتظهر الكلمة دائماً */}
        <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white transition-all hover:bg-blue-700 active:scale-95">
          <span>بحث</span>
        </button>
      </form>

      {hits.length > 0 && (
        <ul className="absolute inset-x-0 top-full mt-2 z-40 overflow-hidden rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
          {hits.map((x) => (
            <li key={x.slug}>
              <Link 
                href={`/specialties/${x.slug}`} 
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800"
              >
                <b className="font-bold">{x.nom_ar}</b>
                <span dir="ltr" className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {x.nom_fr}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
