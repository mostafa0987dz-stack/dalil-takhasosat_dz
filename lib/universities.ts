import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
function client() {
  if (!url || !anon) return null;
  return createClient(url, anon, { auth: { persistSession: false } });
}

export type University = {
  id: string;
  slug: string;
  name_ar: string;
  name_fr: string | null;
  type: string | null;
  wilaya: string | null;
  city: string | null;
  address: string | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
  description_ar: string | null;
};

export type AcceptanceRate = {
  id: number;
  bac_branch: string;
  year: number;
  score: number | null;
  source_url: string | null;
  source_title: string | null;
  verified_at: string | null;
  notes: string | null;
  is_official: boolean;
};

export async function getUniversitiesForSpecialty(specialtySlug: string): Promise<University[]> {
  const sb = client();
  if (!sb) return [];
  const { data, error } = await sb
    .from("university_specialties")
    .select("universities!inner(id,slug,name_ar,name_fr,type,wilaya,city,address,website_url,latitude,longitude,description_ar)")
    .eq("specialty_slug", specialtySlug)
    .eq("is_active", true)
    .eq("universities.is_published", true)
    .order("name_ar", { referencedTable: "universities" });
  if (error) {
    console.error("Unable to load universities for specialty", error.message);
    return [];
  }
  return (data ?? []).map((row: any) => row.universities).filter(Boolean) as University[];
}

export async function getUniversityForSpecialty(specialtySlug: string, universitySlug: string): Promise<University | null> {
  const sb = client();
  if (!sb) return null;
  const { data, error } = await sb
    .from("university_specialties")
    .select("universities!inner(id,slug,name_ar,name_fr,type,wilaya,city,address,website_url,latitude,longitude,description_ar)")
    .eq("specialty_slug", specialtySlug)
    .eq("is_active", true)
    .eq("universities.slug", universitySlug)
    .eq("universities.is_published", true)
    .maybeSingle();
  if (error || !data) return null;
  return (data as any).universities as University;
}

export async function getAcceptanceRates(specialtySlug: string, universityId: string): Promise<AcceptanceRate[]> {
  const sb = client();
  if (!sb) return [];
  const { data, error } = await sb
    .from("acceptance_rates")
    .select("id,bac_branch,year,score,source_url,source_title,verified_at,notes,is_official")
    .eq("specialty_slug", specialtySlug)
    .eq("university_id", universityId)
    .order("year", { ascending: false })
    .order("bac_branch");
  if (error) {
    console.error("Unable to load acceptance rates", error.message);
    return [];
  }
  return (data ?? []) as AcceptanceRate[];
}
