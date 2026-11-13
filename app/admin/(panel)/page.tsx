import Link from "next/link";
import { BookCheck, FileEdit, FlaskConical, Layers, ListChecks, Download } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import AdminTable, { type AdminRow } from "@/components/admin/AdminTable";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await requireAdmin();
  const sb = adminClient();
  const [rowsRes, logsRes, thrRes] = await Promise.all([
    sb.from("specialties").select("slug,nom_ar,domaine,published,updated_at").order("updated_at", { ascending: false }),
    sb.from("audit_log").select("*").order("created_at", { ascending: false }).limit(10),
    sb.from("thresholds").select("specialty_slug,is_demo"),
  ]);
  const base = (rowsRes.data ?? []) as any[];
  const logs = (logsRes.data ?? []) as any[];
  const thr = (thrRes.data ?? []) as any[];

  const rows: AdminRow[] = base.map((r) => {
    const mine = thr.filter((t) => t.specialty_slug === r.slug);
    return { slug: r.slug, nom_ar: r.nom_ar, domaine: r.domaine, published: r.published, updated_at: r.updated_at, seuils: mine.length, demo: mine.some((t) => t.is_demo) };
  });
  const published = rows.filter((r) => r.published).length;
  const domains = new Set(rows.map((r) => r.domaine)).size;
  const demoCount = thr.filter((t) => t.is_demo).length;
  const fmt = (d: string) => new Date(d).toLocaleString("ar-DZ", { dateStyle: "short", timeStyle: "short" });

  const kpis = [
    { l: "إجمالي التخصصات", v: rows.length, Icon: Layers, c: "text-blue-600 bg-blue-100/70 dark:bg-blue-950/60" },
    { l: "منشور", v: published, Icon: BookCheck, c: "text-emerald-600 bg-emerald-100/70 dark:bg-emerald-950/60" },
    { l: "مسودات", v: rows.length - published, Icon: FileEdit, c: "text-slate-600 bg-slate-100/70 dark:bg-slate-800/60" },
    { l: "عتبات مسجلة", v: thr.length, Icon: ListChecks, c: "text-violet-600 bg-violet-100/70 dark:bg-violet-950/60" },
    { l: "عتبات تجريبية", v: demoCount, Icon: FlaskConical, c: "text-amber-600 bg-amber-100/70 dark:bg-amber-950/60" },
    { l: "مجالات", v: domains, Icon: Layers, c: "text-rose-600 bg-rose-100/70 dark:bg-rose-950/60" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">لوحة التحكم</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">إدارة التخصصات والعتبات والاستيراد/التصدير.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/export?format=json" className="btn-ghost"><Download size={14} />JSON</a>
          <a href="/admin/export?format=csv" className="btn-ghost"><Download size={14} />CSV</a>
          <Link href="/admin/specialties/new" className="btn-primary !py-2">+ تخصص جديد</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ l, v, Icon, c }) => (
          <div key={l} className="card !p-4">
            <span className={`mb-3 inline-flex rounded-2xl p-2.5 ${c}`}><Icon size={18} aria-hidden /></span>
            <div className="text-3xl font-black">{v}</div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{l}</div>
          </div>
        ))}
      </div>

      {rowsRes.error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">تعذّرت قراءة البيانات: {rowsRes.error.message}. تأكد من تنفيذ supabase/schema.sql.</p>}
      {!rows.length && !rowsRes.error ? (
        <p className="card text-center text-slate-600 dark:text-slate-400">لا توجد تخصصات بعد. ابدأ بـ <Link href="/admin/import" className="font-bold text-blue-600">استيراد data/specialties.json</Link>.</p>
      ) : <AdminTable rows={rows} />}

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
    </div>
  );
}
