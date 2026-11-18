import { createClient } from "@supabase/supabase-js";
import AdEvents from "@/components/AdEvents";
import AdLink from "@/components/AdLink";
import AdDeviceGate from "@/components/AdDeviceGate";

// FROZEN: الواجهة عربية فقط حالياً؛ نبقي فلترة لغة الإعلان على "all" و"ar".
const LOCALE = "ar";

type AdRow = { id: string; title: string; description: string; image_url: string | null; target_url: string; device: "all" | "mobile" | "desktop"; specialty_slug: string | null };

/**
 * placement + locale + device + specialty_slug.
 * - specialtySlug مُمرَّر: إعلانات هذا التخصص + الإعلانات العامة (specialty_slug فارغ).
 * - غير مُمرَّر: الإعلانات العامة فقط.
 * - device: يُحسم عند العميل (AdDeviceGate) كي تبقى الصفحة static/ISR بلا قراءة user-agent.
 */
export default async function AdSlot({ placement = "inline", specialtySlug }: { placement?: string; specialtySlug?: string }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const slug = specialtySlug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(specialtySlug) ? specialtySlug : null; // يُدرج في فلتر or()؛ نقبل الصيغة الآمنة فقط
  let rows: AdRow[] = [];
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    let q = sb
      .from("ads")
      .select("id,title,description,image_url,target_url,device,specialty_slug")
      .eq("placement", placement)
      .in("locale", ["all", LOCALE])
      .not("approved_at", "is", null);
    q = slug ? q.or(`specialty_slug.is.null,specialty_slug.eq.${slug}`) : q.is("specialty_slug", null);
    const res = await q.order("created_at", { ascending: false }).limit(20);
    rows = (res.data ?? []) as AdRow[];
  } catch {
    return null; // عطل في الإعلانات لا يجب أن يعطّل الصفحة
  }
  if (!rows.length) return null;
  // إعلان التخصص المحدد أولاً ثم الأحدث (الفرز مستقر)
  rows.sort((a, b) => Number(Boolean(b.specialty_slug)) - Number(Boolean(a.specialty_slug)));
  const mobileAd = rows.find((r) => r.device !== "desktop");
  const desktopAd = rows.find((r) => r.device !== "mobile");

  const block = (ad: AdRow) => (
    <aside aria-label="إعلان" className="container-page my-6">
      <AdEvents adId={ad.id} />
      <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          {ad.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.image_url} alt={`إعلان: ${ad.title}`} loading="lazy" className="h-24 w-full rounded-xl object-cover sm:w-40" />)}
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">إعلان</span>
            <h3 className="font-black">{ad.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{ad.description}</p>
          </div>
          <AdLink adId={ad.id} href={ad.target_url} />
        </div>
      </div>
    </aside>
  );

  if (mobileAd && desktopAd && mobileAd.id === desktopAd.id) return block(mobileAd); // device = all
  return (
    <>
      {mobileAd && <AdDeviceGate only="mobile">{block(mobileAd)}</AdDeviceGate>}
      {desktopAd && <AdDeviceGate only="desktop">{block(desktopAd)}</AdDeviceGate>}
    </>
  );
}
