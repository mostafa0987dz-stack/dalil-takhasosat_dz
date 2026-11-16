import { NextResponse } from "next/server";
import { getAdminEmail } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { specialtiesToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** يقرأ كل صفوف جدول على دفعات (PostgREST يقطع النتيجة عند 1000 صف). */
async function fetchAll(table: string, select: string, order: string, filter?: (q: any) => any): Promise<any[]> {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    let q: any = adminClient().from(table).select(select).order(order);
    if (filter) q = filter(q);
    const { data, error } = await q.range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** تصدير الجامعات بنفس صيغة الرفع (قابل لإعادة الاستيراد). ‎?slug=‎ لجامعة واحدة. */
async function universitiesJson(slug: string | null) {
  const unis = await fetchAll("universities", "*", "name_ar", slug ? (q) => q.eq("slug", slug) : undefined);
  const ids = unis.map((u) => u.id);
  const byUni = <T extends { university_id: string }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) m.set(r.university_id, [...(m.get(r.university_id) ?? []), r]);
    return m;
  };
  const inIds = (q: any) => (slug ? q.in("university_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]) : q);
  const links = byUni(await fetchAll("university_specialties", "university_id,specialty_slug,faculty_name,is_active", "id", inIds));
  const rates = byUni(await fetchAll("acceptance_rates", "university_id,specialty_slug,bac_branch,year,score,source_url,source_title,notes,is_official", "id", inIds));
  return {
    universities: unis.map((u) => ({
      slug: u.slug, name_ar: u.name_ar, name_fr: u.name_fr, type: u.type, wilaya: u.wilaya, city: u.city, address: u.address,
      website_url: u.website_url, latitude: u.latitude, longitude: u.longitude, description_ar: u.description_ar, is_published: u.is_published,
      specialties: (links.get(u.id) ?? []).map((l: any) => ({
        specialty_slug: l.specialty_slug, faculty_name: l.faculty_name, is_active: l.is_active,
        rates: (rates.get(u.id) ?? []).filter((r: any) => r.specialty_slug === l.specialty_slug)
          .sort((a: any, b: any) => b.year - a.year || String(a.bac_branch).localeCompare(String(b.bac_branch)))
          .map((r: any) => ({ bac_branch: r.bac_branch, year: r.year, score: r.score === null ? null : Number(r.score), source_url: r.source_url, source_title: r.source_title, is_official: r.is_official, notes: r.notes })),
      })),
    })),
  };
}

export async function GET(req: Request) {
  if (!(await getAdminEmail())) return new NextResponse("Unauthorized", { status: 401 });
  const params = new URL(req.url).searchParams;
  const stamp = new Date().toISOString().slice(0, 10);

  if (params.get("type") === "universities") {
    const slug = params.get("slug");
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return new NextResponse("Bad slug", { status: 400 });
    try {
      return new NextResponse(JSON.stringify(await universitiesJson(slug), null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="universities-${slug ?? "all"}-${stamp}.json"` },
      });
    } catch (e) { return new NextResponse(e instanceof Error ? e.message : "Export failed", { status: 500 }); }
  }

  const format = params.get("format") === "csv" ? "csv" : "json";
  const { data, error } = await adminClient().from("specialties").select("*, thresholds(*)").order("nom_ar");
  if (error) return new NextResponse(error.message, { status: 500 });
  const rows = (data ?? []) as any[];

  if (format === "csv") {
    return new NextResponse(specialtiesToCsv(rows), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="specialties-${stamp}.csv"` },
    });
  }
  // JSON بنفس بنية data/specialties.json (قابل لإعادة الاستيراد)
  const json = rows.map(({ thresholds, published, updated_at, ...r }) => ({
    ...r,
    seuils: (thresholds ?? []).map((t: any) => ({ serie: t.serie, annee: t.annee, moyenne: t.moyenne === null ? null : Number(t.moyenne), remarque: t.remarque, demo: t.is_demo })),
  }));
  return new NextResponse(JSON.stringify(json, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="specialties-${stamp}.json"` },
  });
}
