import { cache } from "react";
import Link from "next/link";
import { BookCheck, Building2, FileEdit, FlaskConical, Layers, ListChecks, Percent } from "lucide-react";
import { adminClient } from "@/lib/supabase";
import AdminTable, { type AdminRow } from "./AdminTable";
import AdminTrendChart, { type TrendPoint } from "./AdminTrendChart";

/* كل قسم يجلب بياناته بنفسه ويُبثّ بشكل مستقل (Suspense): تظهر لوحة التحكم فوراً بدل انتظار أبطأ استعلام. */

async function count(table: string, col: string, filter?: (q: any) => any): Promise<number> {
  let q: any = adminClient().from(table).select(col, { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
}
const domainsOf = cache(async (): Promise<string[]> => {
  const { data } = await adminClient().from("specialties").select("domaine");
  return ((data ?? []) as { domaine: string }[]).map((r) => r.domaine);
});

export function SectionSkeleton({ h = "h-40" }: { h?: string }) {
  return <div role="status" aria-label="جارٍ التحميل" className={`${h} animate-pulse rounded-3xl bg-slate-200/60 dark:bg-slate-800/60`} />;
}
export function KpiSkeleton() {
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5" role="status" aria-label="جارٍ التحميل">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />)}</div>;
}

export async function KpiSection() {
  const [total, published, thr, demo, unis, rates, pending, domains] = await Promise.all([
    count("specialties", "slug"),
    count("specialties", "slug", (q) => q.eq("published", true)),
    count("thresholds", "specialty_slug"),
    count("thresholds", "specialty_slug", (q) => q.eq("is_demo", true)),
    count("universities", "id"),
    count("acceptance_rates", "id"),
    count("ad_campaigns", "id", (q) => q.eq("status", "pending")),
    domainsOf(),
  ]);
  const kpis = [
    { l: "إجمالي التخصصات", v: total, Icon: Layers, c: "text-blue-600 bg-blue-100/70 dark:bg-blue-950/60" },
    { l: "منشور", v: published, Icon: BookCheck, c: "text-emerald-600 bg-emerald-100/70 dark:bg-emerald-950/60" },
    { l: "مسودات", v: Math.max(0, total - published), Icon: FileEdit, c: "text-slate-600 bg-slate-100/70 dark:bg-slate-800/60" },
    { l: "عتبات مسجلة", v: thr, Icon: ListChecks, c: "text-violet-600 bg-violet-100/70 dark:bg-violet-950/60" },
    { l: "عتبات تجريبية", v: demo, Icon: FlaskConical, c: "text-amber-600 bg-amber-100/70 dark:bg-amber-950/60" },
    { l: "مجالات", v: new Set(domains).size, Icon: Layers, c: "text-rose-600 bg-rose-100/70 dark:bg-rose-950/60" },
    { l: "جامعات", v: unis, Icon: Building2, c: "text-sky-600 bg-sky-100/70 dark:bg-sky-950/60" },
    { l: "سجلات معدلات القبول", v: rates, Icon: Percent, c: "text-teal-600 bg-teal-100/70 dark:bg-teal-950/60" },
    { l: "حملات بانتظار المراجعة", v: pending, Icon: FlaskConical, c: "text-orange-600 bg-orange-100/70 dark:bg-orange-950/60" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map(({ l, v, Icon, c }) => (
        <div key={l} className="card !p-4">
          <span className={`mb-3 inline-flex rounded-2xl p-2.5 ${c}`}><Icon size={18} aria-hidden /></span>
          <div className="text-3xl font-black">{v}</div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{l}</div>
        </div>
      ))}
    </div>
  );
}

export async function TrendSection() {
  const sb = adminClient();
  const sinceDate = new Date(); sinceDate.setHours(0, 0, 0, 0); sinceDate.setDate(sinceDate.getDate() - 29);
  const since = sinceDate.toISOString();
  const [eventsRes, activityRes] = await Promise.all([
    sb.from("ad_events").select("event_type,event_day").gte("event_day", since.slice(0, 10)).limit(10000),
    sb.from("audit_log").select("created_at").gte("created_at", since).limit(10000),
  ]);
  const dayMap = new Map<string, TrendPoint>();
  for (let i = 29; i >= 0; i--) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); const key = d.toISOString().slice(0, 10); dayMap.set(key, { day: key, actions: 0, impressions: 0, clicks: 0 }); }
  for (const item of (activityRes.data ?? []) as any[]) { const p = dayMap.get(String(item.created_at ?? "").slice(0, 10)); if (p) p.actions++; }
  for (const e of (eventsRes.data ?? []) as any[]) { const p = dayMap.get(String(e.event_day)); if (p) { if (e.event_type === "impression") p.impressions++; if (e.event_type === "click") p.clicks++; } }
  return (
    <>
      <AdminTrendChart points={Array.from(dayMap.values())} />
      {(eventsRes.error || activityRes.error) && <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">بعض مؤشرات الإعلانات غير متاحة؛ تأكد من تنفيذ مخطط قاعدة البيانات وتسجيل أحداث الإعلانات.</p>}
    </>
  );
}

export async function DomainsSection() {
  const domains = await domainsOf();
  const counts = new Map<string, number>();
  for (const d of domains) counts.set(d, (counts.get(d) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return (
    <section className="card space-y-4">
      <div><h2 className="text-xl font-black">توزيع التخصصات حسب المجال</h2><p className="text-xs text-slate-500">تحليل مبني على بيانات التخصصات المسجلة حالياً.</p></div>
      <div className="space-y-3">
        {top.map(([domain, n]) => { const pct = domains.length ? Math.round((n / domains.length) * 100) : 0; return <div key={domain}><div className="mb-1 flex justify-between text-sm"><b>{domain}</b><span className="text-slate-500">{n} ({pct}%)</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} /></div></div>; })}
        {!top.length && <p className="text-sm text-slate-500">ستظهر الرسوم بعد إضافة التخصصات.</p>}
      </div>
    </section>
  );
}

const ROW_LIMIT = 300;
export async function SpecialtiesSection() {
  const sb = adminClient();
  const [res, demoRes] = await Promise.all([
    sb.from("specialties").select("slug,nom_ar,domaine,published,updated_at,thresholds(count)").order("updated_at", { ascending: false }).limit(ROW_LIMIT),
    sb.from("thresholds").select("specialty_slug").eq("is_demo", true).limit(5000),
  ]);
  if (res.error) return <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">تعذّرت قراءة البيانات: {res.error.message}. تأكد من تنفيذ supabase/schema.sql.</p>;
  const demoSet = new Set(((demoRes.data ?? []) as { specialty_slug: string }[]).map((r) => r.specialty_slug));
  const rows: AdminRow[] = ((res.data ?? []) as any[]).map((r) => ({
    slug: r.slug, nom_ar: r.nom_ar, domaine: r.domaine, published: r.published, updated_at: r.updated_at,
    seuils: Array.isArray(r.thresholds) ? Number(r.thresholds[0]?.count ?? 0) : 0, demo: demoSet.has(r.slug),
  }));
  if (!rows.length) return <p className="card text-center text-slate-600 dark:text-slate-400">لا توجد تخصصات بعد. ابدأ بـ <Link href="/admin/import" className="font-bold text-blue-600">استيراد data/specialties.json</Link>.</p>;
  return (
    <section>
      <h2 className="mb-3 text-xl font-black">التخصصات</h2>
      <AdminTable rows={rows} />
      {rows.length >= ROW_LIMIT && <p className="mt-2 text-xs text-slate-500">عُرض أحدث {ROW_LIMIT} تخصصاً.</p>}
    </section>
  );
}

export async function ActivitySection() {
  const { data } = await adminClient().from("audit_log").select("*").order("created_at", { ascending: false }).limit(10);
  const logs = (data ?? []) as any[];
  const fmt = (d: string) => new Date(d).toLocaleString("ar-DZ", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Algiers" });
  return (
    <section>
      <h2 className="mb-3 text-xl font-black">آخر العمليات</h2>
      <ul className="card divide-y divide-slate-200/60 !p-0 text-sm dark:divide-slate-700/60">
        {logs.map((l) => (
          <li key={l.id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
            <span><b>{l.action}</b> {l.slug && <span dir="ltr" className="text-slate-500">{l.slug}</span>}</span>
            <span className="text-slate-500"><span dir="ltr">{l.admin_email}</span> · {fmt(l.created_at)}</span>
          </li>
        ))}
        {!logs.length && <li className="px-4 py-3 text-slate-500">لا توجد عمليات مسجلة.</li>}
      </ul>
    </section>
  );
}
