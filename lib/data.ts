import { createClient } from "@supabase/supabase-js";
import local from "@/data/specialties.json";
import type { Specialty } from "@/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const hasSupabase = Boolean(url && anon);

function mapRow(r: any): Specialty {
  const { thresholds, published, updated_at, ...rest } = r;
  return {
    ...rest,
    seuils: (thresholds ?? []).map((t: any) => ({
      serie: t.serie,
      annee: t.annee,
      moyenne: t.moyenne === null ? null : Number(t.moyenne),
      remarque: t.remarque,
      demo: t.is_demo,
    })),
  } as Specialty;
}

/** يقرأ التخصصات المنشورة من Supabase، ويرجع إلى data/specialties.json إن لم يُضبط Supabase أو حدث خطأ. */
export async function getSpecialties(): Promise<Specialty[]> {
  if (!hasSupabase) return local as unknown as Specialty[];
  try {
    const sb = createClient(url!, anon!, { auth: { persistSession: false } });
    const { data, error } = await sb
      .from("specialties")
      .select("*, thresholds(*)")
      .eq("published", true)
      .order("nom_ar");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (e) {
    console.error("Supabase read failed, using local data", e);
    return local as unknown as Specialty[];
  }
}

export async function getSpecialty(slug: string) {
  return (await getSpecialties()).find((x) => x.slug === slug);
}
