"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Building2, Compass, GraduationCap, Home } from "lucide-react";

const items = [
  { href: "/", Icon: Home, label: "الرئيسية" },
  { href: "/universities", Icon: Building2, label: "الجامعات" },
  { href: "/specialties", Icon: GraduationCap, label: "التخصصات" },
  { href: "/discover", Icon: Compass, label: "اكتشف" },
  { href: "/blog", Icon: BookOpen, label: "المدونة" },
] as const;

/** شريط تنقل سفلي للهاتف فقط (يختفي من 1024px فما فوق ومن الطباعة). */
export default function MobileTabBar() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav aria-label="التنقل السريع" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-slate-800 dark:bg-slate-950/95">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map(({ href, Icon, label }) => (
          <li key={href}>
            <Link href={href} aria-current={active(href) ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold transition ${active(href) ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
              <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active(href) ? "bg-blue-100 dark:bg-blue-950" : ""}`}><Icon size={19} aria-hidden /></span>
              <span className="max-w-full truncate">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
