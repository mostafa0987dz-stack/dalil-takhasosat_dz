import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import AdEvents from "@/components/AdEvents";
import AdLink from "@/components/AdLink";

function detectDevice(ua: string): "mobile" | "desktop" {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua) ? "mobile" : "desktop";
}

export default async function AdSlot({
  placement = "inline",
  specialtySlug,
}: {
  placement?: string;
  specialtySlug?: string;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const ua = (await headers()).get("user-agent") ?? "";
  const device = detectDevice(ua);
  const targetSlug = specialtySlug ?? "all";

  let data: { id: string; title: string; description: string; image_url: string | null; target_url: string } | null = null;
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const res = await sb
      .from("ads")
      .select("id,title,description,image_url,target_url")
      .eq("placement", placement)
      .in("locale", ["all", "ar"])
      .in("device", ["all", device])
      .in("specialty_slug", targetSlug === "all" ? ["all"] : ["all", targetSlug])
      .not("approved_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    data = res.data;
  } catch {
    return null; // عطل في الإعلانات لا يجب أن يعطّل الصفحة
  }
  if (!data) return null;

  return (
    <aside aria-label="إعلان" className="container-page my-6">
      <AdEvents adId={data.id} />
      <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          {data.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.image_url} alt="" loading="lazy" className="h-24 w-full rounded-xl object-cover sm:w-40" />)}
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">إعلان</span>
            <h3 className="font-black">{data.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
          </div>
          <AdLink adId={data.id} href={data.target_url} />
        </div>
      </div>
    </aside>
  );
}
