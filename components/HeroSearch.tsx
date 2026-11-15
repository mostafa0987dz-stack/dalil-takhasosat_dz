"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { norm } from "@/lib/text";

type Item = { slug: string; nom_ar: string; nom_fr: string; tags?: string[] };

/** ترتيب النتائج: يبدأ بالنص > يحتويه في الاسم > يحتويه في الوسوم. */
function rank(x: Item, n: string): number {
  const ar = norm(x.nom_ar), fr = norm(x.nom_fr);
  if (ar.startsWith(n) || fr.startsWith(n)) return 0;
  if (ar.includes(n) || fr.includes(n)) return 1;
  if ((x.tags ?? []).some((t) => norm(t).includes(n))) return 2;
  return -1;
}

function Mark({ text, q }: { text: string; q: string }) {
  const i = q ? text.indexOf(q) : -1; // تمييز بصري فقط عندما يتطابق النص حرفياً
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="rounded bg-blue-200/70 px-0.5 text-inherit dark:bg-blue-500/30">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

export default function HeroSearch({ items }: { items: Item[] }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const hits = useMemo(() => {
    const n = norm(q);
    if (!n) return [];
    return items
      .map((x) => ({ x, r: rank(x, n) }))
      .filter((h) => h.r >= 0)
      .sort((a, b) => a.r - b.r)
      .slice(0, 6)
      .map((h) => h.x);
  }, [items, q]);

  const showList = open && q.trim().length > 0;

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Escape") { setOpen(false); setActive(-1); }
    else if (e.key === "Enter" && active >= 0 && hits[active]) { e.preventDefault(); router.push(`/specialties/${hits[active].slug}`); }
  }

  return (
    <div className="relative z-40 max-w-xl">
      <form action="/specialties" role="search" className="flex items-center gap-2 rounded-3xl border border-white/60 bg-white/85 p-2 shadow-xl shadow-blue-900/20 backdrop-blur-xl">
        <Search className="mr-2 shrink-0 text-slate-400" size={20} aria-hidden />
        <input
          name="q" value={q} autoComplete="off" role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined} aria-label="ابحث عن تخصص" placeholder="ابحث عن تخصص... مثال: طب، قانون، IA"
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} onKeyDown={onKey}
          className="min-w-0 flex-1 bg-transparent py-2 text-slate-900 outline-none placeholder:text-slate-400"
        />
        {q && <button type="button" onClick={() => { setQ(""); setActive(-1); }} className="p-2 text-slate-400 transition-colors hover:text-red-500" aria-label="مسح البحث"><X size={18} /></button>}
        <button className="rounded-2xl bg-blue-600 px-5 py-2.5 font-bold text-white transition-all hover:bg-blue-700 active:scale-95">بحث</button>
      </form>

      {showList && (
        <ul id={listId} role="listbox" aria-label="اقتراحات التخصصات" className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-3xl border border-white/60 bg-white/95 text-slate-900 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-100">
          {hits.map((x, i) => (
            <li key={x.slug} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <Link href={`/specialties/${x.slug}`} onMouseEnter={() => setActive(i)} className={`flex items-center justify-between px-4 py-3 transition-colors ${i === active ? "bg-blue-50 dark:bg-slate-800" : "hover:bg-blue-50 dark:hover:bg-slate-800"}`}>
                <b className="font-bold"><Mark text={x.nom_ar} q={q.trim()} /></b>
                <span dir="ltr" className="text-xs font-medium text-slate-500 dark:text-slate-400">{x.nom_fr}</span>
              </Link>
            </li>
          ))}
          {!hits.length && <li className="px-4 py-4 text-sm text-slate-500">لا توجد اقتراحات — اضغط «بحث» لعرض كل النتائج.</li>}
        </ul>
      )}
    </div>
  );
}
