"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Moon, Sun, X } from "lucide-react";

const links = [
  ["الرئيسية", "/"],
  ["التخصصات", "/specialties"],
  ["الشعب", "/bac"],
  ["حاسبة المعدل", "/calculator"],
  ["عتبات القبول", "/seuils"],
  ["مقارنة", "/compare"],
] as const;

export default function Header() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  useEffect(() => setOpen(false), [pathname]);

  function toggle() {
    const value = !dark;
    setDark(value);
    document.documentElement.classList.toggle("dark", value);
    try { localStorage.setItem("theme", value ? "dark" : "light"); } catch {}
  }

  const active = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));
  const linkCls = (url: string) =>
    `text-sm font-semibold transition hover:text-brand-700 dark:hover:text-blue-400 ${active(url) ? "text-brand-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-300"}`;

  return (
    <header className="no-print sticky top-0 z-50 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/70">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-black text-brand-700 dark:text-blue-400">
          دليل التخصصات <span className="text-slate-500">الجزائرية</span>
        </Link>
        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-6 lg:flex">
          {links.map(([label, url]) => (
            <Link key={url} href={url} className={linkCls(url)} aria-current={active(url) ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/favorites" aria-label="المفضلة" className="rounded-xl border p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"><Heart size={18} /></Link>
          <button aria-label="تبديل الوضع الليلي" onClick={toggle} className="rounded-xl border p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button aria-label="القائمة" aria-expanded={open} className="rounded-xl border p-2 lg:hidden dark:border-slate-700" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="القائمة المحمولة" className="container-page grid gap-1 pb-4 lg:hidden">
          {links.map(([label, url]) => (
            <Link key={url} href={url} className={`rounded-xl px-4 py-3 ${active(url) ? "bg-blue-50 text-brand-700 dark:bg-blue-950 dark:text-blue-300" : "hover:bg-slate-100 dark:hover:bg-slate-800"} font-semibold`}>{label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
