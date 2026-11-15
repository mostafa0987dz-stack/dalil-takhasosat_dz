import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { reviewAdCampaign } from "@/app/admin/actions";
import AdCampaignForm from "@/components/admin/AdCampaignForm";

export const dynamic = "force-dynamic";
export default async function AdsPage() {
  await requireAdmin();
  const sb = adminClient();
  const [{ data: campaigns, error }, { data: events }] = await Promise.all([
    sb.from("ad_campaigns").select("id,name,source,status,monthly_price,currency,created_at").order("created_at", { ascending: false }).limit(100),
    sb.from("ad_events").select("event_type").gte("event_day", new Date(Date.now()-30*86400000).toISOString().slice(0,10)),
  ]);
  const impressions = (events ?? []).filter(x => x.event_type === "impression").length;
  const clicks = (events ?? []).filter(x => x.event_type === "click").length;
  return <div className="space-y-7"><div><h1 className="section-title">إدارة الإعلانات</h1><p className="mt-2 text-sm text-slate-500">Direct وAdSense والإعلانات التعليمية الممولة. النشر يتطلب موافقة إدارية.</p></div>
    <div className="grid gap-3 sm:grid-cols-3"><div className="card"><p className="text-sm text-slate-500">الحملات</p><b className="text-3xl">{campaigns?.length ?? 0}</b></div><div className="card"><p className="text-sm text-slate-500">مرات الظهور · 30 يوماً</p><b className="text-3xl">{impressions}</b></div><div className="card"><p className="text-sm text-slate-500">النقرات · 30 يوماً</p><b className="text-3xl">{clicks}</b><p className="text-xs text-slate-400">CTR: {impressions ? (clicks/impressions*100).toFixed(2) : "0.00"}%</p></div></div>
    <section className="card space-y-4"><h2 className="text-xl font-black">إضافة إعلان / حملة</h2><AdCampaignForm /></section>
    <section className="card space-y-3"><h2 className="text-xl font-black">الحملات والإعلانات</h2>{error && <p className="text-sm text-red-600">{error.message} — نفّذ تحديث schema.sql أولاً.</p>}{(campaigns ?? []).map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 dark:border-slate-800"><div><b>{c.name}</b><p className="text-xs text-slate-500">{c.source} · {c.monthly_price} {c.currency} · {c.status}</p></div><div className="flex gap-2">{c.status !== "active" && <form action={reviewAdCampaign}><input type="hidden" name="id" value={c.id}/><input type="hidden" name="status" value="active"/><button className="btn-ghost !py-2">موافقة ونشر</button></form>}{c.status === "active" && <form action={reviewAdCampaign}><input type="hidden" name="id" value={c.id}/><input type="hidden" name="status" value="paused"/><button className="btn-ghost !py-2">إيقاف</button></form>}<form action={reviewAdCampaign}><input type="hidden" name="id" value={c.id}/><input type="hidden" name="status" value="rejected"/><button className="btn-ghost !py-2 text-red-600">رفض</button></form></div></div>)}{!campaigns?.length && <p className="text-sm text-slate-500">لا توجد حملات بعد.</p>}</section>
  </div>;
}
