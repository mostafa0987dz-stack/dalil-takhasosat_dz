import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import local from "@/data/specialties.json";
import type { Specialty } from "@/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const hasSupabase = Boolean(url && anon);

function mapRow(r: any): Specialty {
  const { thresholds, published, ...rest } = r;
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
async function load_getSpecialties(): Promise<Specialty[]> {
  if (!hasSupabase) return local as unknown as Specialty[];
  try {
    const sb = createClient(url!, anon!, { auth: { persistSession: false } });
    // سقف PostgREST = 1000 صف لكل طلب: نقرأ على دفعات حتى تُرجع الدفعة أقل من 1000
    const rows: any[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb
        .from("specialties")
        .select("*, thresholds(*)")
        .eq("published", true)
        .order("nom_ar")
        .order("slug") // ترتيب ثابت بين الدفعات (nom_ar قد يتكرر)
        .range(from, from + 999);
      if (error) throw error;
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    return rows.map(mapRow);
  } catch (e) {
    console.error("Supabase read failed, using local data", e);
    return local as unknown as Specialty[];
  }
}

async function load_getSpecialty(slug: string) {
  return (await getSpecialties()).find((x) => x.slug === slug);
}

// نتائج مُخزَّنة طوال الطلب الواحد: generateMetadata والصفحة يتشاركان البيانات بلا استعلام مكرر
export const getSpecialties = cache(load_getSpecialties);
export const getSpecialty = cache(load_getSpecialty);
