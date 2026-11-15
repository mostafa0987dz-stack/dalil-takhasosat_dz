import { NextResponse } from "next/server";
import { getAdminEmail } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { specialtiesToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getAdminEmail())) return new NextResponse("Unauthorized", { status: 401 });
  const format = new URL(req.url).searchParams.get("format") === "csv" ? "csv" : "json";
  const { data, error } = await adminClient().from("specialties").select("*, thresholds(*)").order("nom_ar");
  if (error) return new NextResponse(error.message, { status: 500 });
  const rows = (data ?? []) as any[];
  const stamp = new Date().toISOString().slice(0, 10);

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
