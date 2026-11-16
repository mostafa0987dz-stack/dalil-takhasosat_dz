"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Moon, Sun, X, Languages } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";

const links = [
  ["الرئيسية", "/"],
  ["التخصصات", "/specialties"],
  ["الشعب", "/bac"],
  ["حاسبة المعدل", "/calculator"],
  ["الجامعات", "/universities"],
  ["أين أقبل؟", "/finder"],
  ["عتبات القبول", "/seuils"],
  ["مقارنة", "/compare"],
] as const;

export default function Header() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<"ar"|"fr"|"en">("ar");
  const { fav } = useFavorites();

  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); const l=document.documentElement.lang; if(l === "fr" || l === "en") setLocale(l); }, []);
  useEffect(() => setOpen(false), [pathname]);

  function toggle() {
    const value = !dark;
    setDark(value);
    document.documentElement.classList.toggle("dark", value);
    try { localStorage.setItem("theme", value ? "dark" : "light"); } catch {}
  }

  const labels = locale === "fr" ? ["Accueil", "Spécialités", "Séries du bac", "Calculateur", "Universités", "Où être admis ?", "Seuils", "Comparer"] : locale === "en" ? ["Home", "Specialties", "Bac streams", "Calculator", "Universities", "Where can I get in?", "Thresholds", "Compare"] : ["الرئيسية", "التخصصات", "الشعب", "حاسبة المعدل", "الجامعات", "أين أقبل؟", "عتبات القبول", "مقارنة"];
  async function changeLocale(next: "ar"|"fr"|"en") {
    const response = await fetch("/api/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: next }) });
    if (response.ok) { setLocale(next); window.location.reload(); }
  }
  const active = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));
  const linkCls = (url: string) =>
    `text-sm font-semibold transition hover:text-brand-700 dark:hover:text-blue-400 ${active(url) ? "text-brand-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-300"}`;

  return (
    <header className="no-print sticky top-0 z-50 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/70">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-black text-brand-700 dark:text-blue-400">
          {locale === "fr" ? "Guide des spécialités algériennes" : locale === "en" ? "Algerian University Guide" : <>دليل التخصصات <span className="text-slate-500">الجزائرية</span></>}
        </Link>
        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-4 xl:gap-6 lg:flex">
          {links.map(([, url], i) => (
            <Link key={url} href={url} className={linkCls(url)} aria-current={active(url) ? "page" : undefined}>{labels[i]}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 rounded-xl border border-slate-200/70 bg-white/40 px-2 py-2 text-xs dark:border-slate-700/70 dark:bg-slate-900/40"><Languages size={15}/><select aria-label="Language" value={locale} onChange={e => changeLocale(e.target.value as "ar"|"fr"|"en")} className="bg-transparent outline-none"><option value="ar">عربي</option><option value="fr">FR</option><option value="en">EN</option></select></label>
          <Link href="/favorites" aria-label={`المفضلة (${fav.length})`} className="relative rounded-2xl border border-slate-200/70 bg-white/40 p-2 hover:bg-white/80 dark:border-slate-700/70 dark:bg-slate-900/40 dark:hover:bg-slate-800"><Heart size={18} />{fav.length > 0 && <span className="absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{fav.length}</span>}</Link>
          <button aria-label="تبديل الوضع الليلي" onClick={toggle} className="rounded-2xl border border-slate-200/70 bg-white/40 p-2 hover:bg-white/80 dark:border-slate-700/70 dark:bg-slate-900/40 dark:hover:bg-slate-800">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button aria-label="القائمة" aria-expanded={open} className="rounded-2xl border border-slate-200/70 p-2 lg:hidden dark:border-slate-700/70" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="القائمة المحمولة" className="container-page grid gap-1 pb-4 lg:hidden">
          {links.map(([, url], i) => (
            <Link key={url} href={url} className={`rounded-xl px-4 py-3 ${active(url) ? "bg-blue-50 text-brand-700 dark:bg-blue-950 dark:text-blue-300" : "hover:bg-slate-100 dark:hover:bg-slate-800"} font-semibold`}>{labels[i]}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
