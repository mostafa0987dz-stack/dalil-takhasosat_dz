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
  updated_at?: string | null;
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
    .select("id,bac_branch,year,score,source_url,source_title,verified_at,notes,is_official,updated_at")
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

/* ---------- صفحات الجامعات والباحث «أين أقبل؟» ---------- */
const UNI_COLUMNS = "id,slug,name_ar,name_fr,type,wilaya,city,address,website_url,latitude,longitude,description_ar";

/** يقرأ كل الصفوف على دفعات (PostgREST يقطع النتيجة عند 1000 صف). */
async function paged<T>(make: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: { message: string } | null }>, max = 20000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await make(from, from + 999);
    if (error) { console.error("Paged read failed", error.message); break; }
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export type UniversityListItem = University & { specialties_count: number };

export async function getPublishedUniversities(): Promise<UniversityListItem[]> {
  const sb = client();
  if (!sb) return [];
  const { data, error } = await sb.from("universities").select(`${UNI_COLUMNS},university_specialties(count)`).eq("is_published", true).order("name_ar");
  if (error) { console.error("Unable to load universities", error.message); return []; }
  return (data ?? []).map((u: any) => {
    const { university_specialties, ...rest } = u;
    return { ...rest, specialties_count: Array.isArray(university_specialties) ? Number(university_specialties[0]?.count ?? 0) : 0 } as UniversityListItem;
  });
}

export async function getUniversityBySlug(slug: string): Promise<University | null> {
  const sb = client();
  if (!sb) return null;
  const { data, error } = await sb.from("universities").select(UNI_COLUMNS).eq("slug", slug).eq("is_published", true).maybeSingle();
  if (error || !data) return null;
  return data as University;
}

export type UniversitySpecialty = { specialty_slug: string; faculty_name: string | null; nom_ar: string; nom_fr: string | null; domaine: string; diplome: string; duree: string };

export async function getUniversitySpecialties(universityId: string): Promise<UniversitySpecialty[]> {
  const sb = client();
  if (!sb) return [];
  const { data, error } = await sb
    .from("university_specialties")
    .select("specialty_slug,faculty_name,specialties!inner(nom_ar,nom_fr,domaine,diplome,duree)")
    .eq("university_id", universityId)
    .eq("is_active", true);
  if (error) { console.error("Unable to load university specialties", error.message); return []; }
  return (data ?? [])
    .map((r: any) => ({ specialty_slug: r.specialty_slug, faculty_name: r.faculty_name, ...r.specialties }) as UniversitySpecialty)
    .sort((a, b) => a.nom_ar.localeCompare(b.nom_ar, "ar"));
}

export type UniversityRate = { specialty_slug: string; bac_branch: string; year: number; score: number | null; updated_at: string | null };

export async function getUniversityRates(universityId: string): Promise<UniversityRate[]> {
  const sb = client();
  if (!sb) return [];
  const rows = await paged<any>((from, to) => sb.from("acceptance_rates").select("specialty_slug,bac_branch,year,score,updated_at").eq("university_id", universityId).order("id").range(from, to));
  return rows.map((r) => ({ ...r, score: r.score === null ? null : Number(r.score) }));
}

export type AdmissionMatch = {
  university_slug: string; university_name: string; wilaya: string | null;
  specialty_slug: string; specialty_name: string; domaine: string;
  year: number; score: number; status: "ok" | "near";
};

/** أحدث معدل لكل (جامعة، تخصص) في شعبة معينة، مصنَّفاً حسب معدل الطالب: ok = معدلك ≥ المعدل، near = ينقصك ≤ 1 نقطة. */
export async function findAdmissions(opts: { branch: string; average: number; wilaya?: string }): Promise<AdmissionMatch[]> {
  const sb = client();
  if (!sb) return [];
  const rows = await paged<any>((from, to) => {
    let q = sb
      .from("acceptance_rates")
      .select("university_id,specialty_slug,year,score,universities!inner(slug,name_ar,wilaya),specialties!inner(nom_ar,domaine)")
      .eq("bac_branch", opts.branch)
      .not("score", "is", null)
      .eq("universities.is_published", true);
    if (opts.wilaya) q = q.eq("universities.wilaya", opts.wilaya);
    return q.order("year", { ascending: false }).order("id").range(from, to);
  }, 10000);
  const latest = new Map<string, any>();
  for (const r of rows) {
    const key = `${r.university_id}|${r.specialty_slug}`;
    if (!latest.has(key)) latest.set(key, r);
  }
  const out: AdmissionMatch[] = [];
  for (const r of latest.values()) {
    const score = Number(r.score);
    const diff = score - opts.average;
    if (diff > 1) continue;
    out.push({
      university_slug: r.universities.slug, university_name: r.universities.name_ar, wilaya: r.universities.wilaya,
      specialty_slug: r.specialty_slug, specialty_name: r.specialties.nom_ar, domaine: r.specialties.domaine,
      year: r.year, score, status: diff <= 0 ? "ok" : "near",
    });
  }
  return out.sort((a, b) => (a.status === b.status ? b.score - a.score : a.status === "ok" ? -1 : 1));
}
