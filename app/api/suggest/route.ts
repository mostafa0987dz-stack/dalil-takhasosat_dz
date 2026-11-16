import { NextResponse } from "next/server";
import { getSpecialties } from "@/lib/data";
import { norm } from "@/lib/text";

/** اقتراحات بحث الصفحة الرئيسية: تُجلب عند الكتابة فقط بدل تضمين كل التخصصات في HTML الصفحة. */
export async function GET(req: Request) {
  const n = norm((new URL(req.url).searchParams.get("q") ?? "").slice(0, 60));
  const headers = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" };
  if (!n) return NextResponse.json({ items: [] }, { headers });
  const data = await getSpecialties();
  const rank = (x: (typeof data)[number]) => {
    const ar = norm(x.nom_ar), fr = norm(x.nom_fr ?? ""), en = norm(x.nom_en ?? "");
    if (ar.startsWith(n) || fr.startsWith(n) || en.startsWith(n)) return 0;
    if (ar.includes(n) || fr.includes(n) || en.includes(n)) return 1;
    if ((x.tags ?? []).some((t) => norm(t).includes(n))) return 2;
    return -1;
  };
  const items = data
    .map((x) => ({ x, r: rank(x) }))
    .filter((h) => h.r >= 0)
    .sort((a, b) => a.r - b.r)
    .slice(0, 6)
    .map(({ x }) => ({ slug: x.slug, nom_ar: x.nom_ar, nom_fr: x.nom_fr, nom_en: x.nom_en }));
  return NextResponse.json({ items }, { headers });
}
