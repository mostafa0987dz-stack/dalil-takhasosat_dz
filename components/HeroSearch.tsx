"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { norm } from "@/lib/text";

type Item = { slug: string; nom_ar: string; nom_fr: string };

export default function HeroSearch({ items }: { items: Item[] }) {
  const [q, setQ] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const n = norm(q);
  const hits = n ? items.filter((x) => norm(`${x.nom_ar} ${x.nom_fr}`).includes(n)).slice(0, 5) : [];

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative max-w-xl z-50">
      <form action="/specialties" className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-blue-900/20 ring-1 ring-black/5">
        <Search className="ml-2 text-slate-400" size={20} />
        
        <input
          name="q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          aria-label="ابحث عن تخصص"
          placeholder="ابحث عن تخصص..."
          className="w-full bg-transparent py-3 text-slate-800 outline-none placeholder:text-slate-400"
        />
        
        {/* زر المسح السريع */}
        {q && (
          <button 
            type="button" 
            onClick={() => { setQ(""); setIsOpen(false); }} 
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            aria-label="مسح البحث"
          >
            <X size={18} />
          </button>
        )}
        
        <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition-all hover:bg-blue-700 active:scale-95">
          <Search size={18} className="hidden sm:block" />
          <span>بحث</span>
        </button>
      </form>

      {/* القائمة المنسدلة للنتائج */}
      {isOpen && hits.length > 0 && (
        <ul className="absolute inset-x-0 top-full mt-2 z-10 overflow-hidden rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
          {hits.map((x) => (
            <li key={x.slug}>
              <Link 
                href={`/specialties/${x.slug}`} 
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800"
              >
                <b>{x.nom_ar}</b>
                <span dir="ltr" className="text-xs font-medium text-slate-500 dark:text-slate-400">{x.nom_fr}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
