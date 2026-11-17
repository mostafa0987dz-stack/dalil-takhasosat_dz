import { createClient } from "@supabase/supabase-js";
import { SERIES } from "@/lib/constants";
export type BacSeries = { slug: string; name_ar: string; name_fr: string; name_en: string; sort_order: number; is_active: boolean };
export async function getBacSeries(): Promise<BacSeries[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return SERIES.map((s, i) => ({ slug:s.slug, name_ar:s.name, name_fr:"", name_en:"", sort_order:(i+1)*10, is_active:true }));
  try {
    const { data, error } = await createClient(url, anon, { auth:{persistSession:false} }).from("bac_series").select("slug,name_ar,name_fr,name_en,sort_order,is_active").eq("is_active",true).order("sort_order");
    if (error || !data?.length) throw error ?? new Error("No series");
    return data as BacSeries[];
  } catch { return SERIES.map((s, i) => ({ slug:s.slug, name_ar:s.name, name_fr:"", name_en:"", sort_order:(i+1)*10, is_active:true })); }
}
