import { createClient } from "@supabase/supabase-js";
import AdEvents from "@/components/AdEvents";
import AdLink from "@/components/AdLink";

export default async function AdSlot({ placement = "inline" }: { placement?: string }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await sb
    .from("ads")
    .select("id,title,description,image_url,target_url")
    .eq("placement", placement)
    .not("approved_at", "is", null)
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  return (
    <aside aria-label="إعلان" className="container-page my-6">
      <AdEvents adId={data.id} />
      <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          {data.image_url && <img src={data.image_url} alt="" loading="lazy" className="h-24 w-full rounded-xl object-cover sm:w-40" />}
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
