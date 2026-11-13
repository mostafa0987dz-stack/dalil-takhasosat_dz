"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, Link2, MessageCircle, X } from "lucide-react";
import type { Specialty } from "@/types";
import { minSeuil } from "@/lib/specialty";

const SLOTS = 3;

export default function CompareClient({ items }: { items: Specialty[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const slugs = Array.from(new Set((sp.get("s") ?? "").split(",").filter((x) => items.some((i) => i.slug === x)))).slice(0, SLOTS);
  const chosen = slugs.map((x) => items.find((i) => i.slug === x)!);

  function go(list: string[]) {
    router.replace(list.length ? `/compare?s=${list.join(",")}` : "/compare", { scroll: false });
  }
  function setSlot(i: number, v: string) {
    const next = [...slugs];
    if (v) next[i] = v; else next.splice(i, 1);
    go(next.filter(Boolean));
  }
  async function copy() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  const allSeries = Array.from(new Set(chosen.flatMap((s) => s.seuils.map((t) => t.serie))));
  const latest = (s: Specialty, serie: string) => s.seuils.filter((t) => t.serie === serie).sort((a, b) => b.annee - a.annee)[0];

  const rows: [string, (s: Specialty) => React.ReactNode][] = [
    ["المجال", (s) => s.domaine],
    ["الشهادة", (s) => s.diplome],
    ["المدة", (s) => s.duree],
    ["الشعب المؤهلة", (s) => s.filiere.join("، ")],
    ["أدنى عتبة معروفة", (s) => { const m = minSeuil(s); return m === null ? "—" : <b>{m.toFixed(2)}</b>; }],
    ...allSeries.map((serie): [string, (s: Specialty) => React.ReactNode] => [
      `عتبة ${serie}`,
      (s) => { const t = latest(s, serie); return t?.moyenne != null ? <span><b>{t.moyenne.toFixed(2)}</b> <span className="text-xs text-slate-500">({t.annee}{t.demo ? "، تجريبية" : ""})</span></span> : "—"; },
    ]),
    ["المهارات", (s) => <ul className="list-inside list-disc space-y-1">{s.competences.map((x) => <li key={x}>{x}</li>)}</ul>],
    ["آفاق التوظيف", (s) => <ul className="list-inside list-disc space-y-1">{s.debouches.map((x) => <li key={x}>{x}</li>)}</ul>],
    ["الجامعات", (s) => s.universites.join("، ") || "—"],
  ];

  return (
    <section className="container-page py-12">
      <h1 className="section-title mb-3">مقارنة التخصصات</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">اختر حتى ثلاثة تخصصات لمقارنتها جنباً إلى جنب. الرابط يحفظ اختيارك ويمكن مشاركته.</p>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {Array.from({ length: SLOTS }, (_, i) => (
          <select key={i} className="input" aria-label={`التخصص ${i + 1}`} value={slugs[i] ?? ""} onChange={(e) => setSlot(i, e.target.value)}>
            <option value="">اختر تخصصاً {i + 1}</option>
            {items.map((x) => <option key={x.slug} value={x.slug} disabled={slugs.includes(x.slug) && slugs[i] !== x.slug}>{x.nom_ar}</option>)}
          </select>
        ))}
      </div>

      {chosen.length >= 1 ? (
        <>
          <div className="no-print mb-4 flex flex-wrap gap-2">
            <button onClick={copy} className="btn-ghost">{copied ? <Check size={16} /> : <Link2 size={16} />}{copied ? "تم نسخ الرابط" : "نسخ رابط المقارنة"}</button>
            <button
              className="btn-ghost hover:!text-emerald-600"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`مقارنة التخصصات: ${chosen.map((c) => c.nom_ar).join(" ↔ ")}\n${window.location.href}`)}`, "_blank", "noopener,noreferrer")}
            ><MessageCircle size={16} />مشاركة عبر واتساب</button>
            <button onClick={() => go([])} className="btn-ghost"><X size={16} />مسح المقارنة</button>
          </div>
          <div className="table-wrap">
            <table className="w-full min-w-[32rem] text-right align-top">
              <thead className="bg-white/50 dark:bg-slate-800/40">
                <tr>
                  <th scope="col" className="th w-32"><span className="sr-only">المعيار</span></th>
                  {chosen.map((s) => (
                    <th key={s.slug} scope="col" className="th text-base">
                      <Link href={`/specialties/${s.slug}`} className="hover:text-blue-600">{s.nom_ar}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, fn]) => (
                  <tr key={label} className="border-t border-slate-200/60 dark:border-slate-700/60">
                    <th scope="row" className="th text-slate-600 dark:text-slate-400">{label}</th>
                    {chosen.map((s) => <td key={s.slug} className="p-4 text-sm leading-7">{fn(s)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : <p className="py-12 text-center text-slate-600 dark:text-slate-400">اختر تخصصاً واحداً على الأقل لعرض المقارنة.</p>}
    </section>
  );
}
