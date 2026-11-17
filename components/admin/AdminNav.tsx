"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, FileUp, Megaphone, Settings, GraduationCap, Building2 } from "lucide-react";

const groups = [
  { title: "المحتوى", items: [
    { href: "/admin", label: "نظرة عامة", Icon: LayoutDashboard, exact: true },
    { href: "/admin/specialties/new", label: "إضافة تخصص", Icon: PlusCircle },
    { href: "/admin/universities", label: "الجامعات", Icon: Building2 },
    { href: "/admin/import", label: "استيراد وتصدير", Icon: FileUp },
  ] },
  { title: "الموقع", items: [
    { href: "/admin/series", label: "شعب البكالوريا", Icon: GraduationCap },
    { href: "/admin/ads", label: "الإعلانات", Icon: Megaphone },
    { href: "/admin/settings", label: "الإعدادات", Icon: Settings },
  ] },
];

export default function AdminNav() {
  const path = usePathname() ?? "";
  const isActive = (href: string, exact?: boolean) => (exact ? path === href : path === href || path.startsWith(`${href}/`));
  return (
    <nav aria-label="القائمة الرئيسية" className="space-y-5 px-3">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="mx-2 mb-1.5 text-xs font-bold text-slate-400">{g.title}</div>
          <div className="space-y-1">
            {g.items.map(({ href, label, Icon, exact }) => (
              <Link key={href} href={href} aria-current={isActive(href, exact) ? "page" : undefined} className="admin-nav-link">
                <Icon size={18} aria-hidden /><span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
