"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import DomainIcon, { domainCls } from "./DomainIcon";
import { admissionStatus } from "@/lib/rates";

export type UniSpecialtyView = {
  slug: string; nom_ar: string; domaine: string; diplome: string; duree: string; faculty: string | null;
  rates: { b: string; y: number; s: number }[]; // أحدث معدل لكل شعبة
};
type Status = "ok" | "near" | "high" | "none";
const ORDER: Record<Status, number> = { ok: 0, near: 1, high: 2, none: 3 };
const BADGE: Record<Status, { text: string; cls: string }> = {
  ok: { text: "معدلك يكفي", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  near: { text: "قريب (ينقصك ≤ 1)", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  high: { text: "أعلى من معدلك", cls: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" },
  none: { text: "لا معدل لشعبتك", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

export default function UniversitySpecialties({ universitySlug, items, branches }: { universitySlug: string; items: UniSpecialtyView[]; branches: string[] }) {
  const [branch, setBranch] = useState("");
  const [avg, setAvg] = useState("");
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const average = Number(avg.replace(",", "."));
  const personal = Boolean(branch) && avg.trim() !== "" && Number.isFinite(average) && average >= 0 && average <= 20;
  const domains = useMemo(() => Array.from(new Set(items.map((i) => i.domaine))).sort((a, b) => a.localeCompare(b, "ar")), [items]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = items.filter((i) => (!domain || i.domaine === domain) && (!needle || i.nom_ar.toLowerCase().includes(needle) || (i.faculty ?? "").toLowerCase().includes(needle)));
    return base.map((i) => {
      const mine = i.rates.find((r) => r.b === branch);
      const min = i.rates.length ? Math.min(...i.rates.map((r) => r.s)) : null;
      let status: Status = "none";
      if (personal && mine) status = admissionStatus(mine.s, average);
      return { i, mine, min, status };
    }).sort((a, b) => (personal ? ORDER[a.status] - ORDER[b.status] : 0) || a.i.nom_ar.localeCompare(b.i.nom_ar, "ar"));
  }, [items, q, domain, branch, personal, average]);

  const okCount = personal ? rows.filter((r) => r.status === "ok").length : 0;

  // تجميع حسب الكلية (على النتائج المفلترة)؛ إن كانت كل الكليات فارغة نبقى على العرض المسطّح/حسب المجال
  const hasFaculties = items.some((i) => (i.faculty ?? "").trim() !== "");
  const facultyGroups = useMemo(() => {
    if (!hasFaculties) return null;
    const m = new Map<string, typeof rows>();
    for (const r of rows) { const f = (r.i.faculty ?? "").trim(); m.set(f, [...(m.get(f) ?? []), r]); }
    return [...m.entries()].sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "ar")));
  }, [rows, hasFaculties]);
  const grouped = !personal;
  const groups = grouped ? domains.filter((d) => rows.some((r) => r.i.domaine === d)) : [""];

  const card = (r: (typeof rows)[number]) => (
    <Link key={r.i.slug} prefetch={false} href={`/specialties/${r.i.slug}/${universitySlug}`} className="card card-hover group flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-black group-hover:text-blue-600">{r.i.nom_ar}</h3>
        {personal && <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${BADGE[r.status].cls}`}>{BADGE[r.status].text}</span>}
      </div>
      {r.i.faculty && <p className="text-sm text-slate-500">{r.i.faculty}</p>}
      <p className="text-xs text-slate-500">{r.i.diplome} · {r.i.duree}</p>
      <p className="mt-auto pt-2 text-sm font-bold text-blue-600">
        {personal && r.mine ? `آخر معدل لشعبتك: ${r.mine.s.toFixed(2)} (${r.mine.y})` : r.min !== null ? `أدنى معدل مسجل: ${r.min.toFixed(2)}` : "المعدلات قيد الإضافة"}
      </p>
    </Link>
  );

  return (
    <div className="space-y-5">
      <div className="card grid gap-3 md:grid-cols-[1fr_9rem_1fr_1fr]">
        <label className="text-sm font-bold">شعبتك
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="input mt-1">
            <option value="">اختر الشعبة</option>{branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">معدلك
          <input value={avg} onChange={(e) => setAvg(e.target.value)} inputMode="decimal" placeholder="مثال: 14.5" className="input mt-1" />
        </label>
        <label className="relative text-sm font-bold">بحث في التخصصات
          <Search size={16} aria-hidden className="pointer-events-none absolute right-4 top-[2.55rem] text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسم التخصص أو الكلية" className="input mt-1 !pr-11" />
        </label>
        <label className="text-sm font-bold">المجال
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="input mt-1">
            <option value="">كل المجالات</option>{domains.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      </div>
      {personal ? (
        <p role="status" className="rounded-2xl bg-blue-50 p-4 text-sm leading-7 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
          معدلك {average.toFixed(2)} في شعبة «{branch}» يكفي لـ <b>{okCount}</b> تخصص من {rows.length} حسب آخر معدل مسجل. المعدلات تتغير كل سنة، فاعتبرها مؤشراً لا ضماناً.
        </p>
      ) : (
        <p className="text-sm text-slate-500">اختر شعبتك وأدخل معدلك لترتيب التخصصات حسب فرصك في هذه الجامعة.</p>
      )}
      {facultyGroups ? facultyGroups.map(([name, list]) => (
        <section key={name || "none"} aria-label={name || "غير محدد"}>
          <h3 className="mb-3 flex flex-wrap items-center gap-2 text-base font-black">
            <span>{name || "غير محدد"}</span>
            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{list.length} تخصصاً</span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map(card)}</div>
        </section>
      )) : groups.map((g) => (
        <section key={g || "all"} aria-label={g || "التخصصات"}>
          {g && <h3 className={`mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${domainCls(g)}`}><DomainIcon domaine={g} size={15} />{g}</h3>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.filter((r) => !g || r.i.domaine === g).map(card)}</div>
        </section>
      ))}
      {!rows.length && <p className="card text-slate-600 dark:text-slate-400">لا توجد تخصصات مطابقة.</p>}
    </div>
  );
}
