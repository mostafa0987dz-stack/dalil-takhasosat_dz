import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { getBacSeries } from "@/lib/series";
import RatesEditor from "@/components/admin/RatesEditor";
import type { RateRecord } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function UniversityRatesPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = adminClient();
  const [uRes, linksRes, series] = await Promise.all([
    sb.from("universities").select("id,slug,name_ar").eq("id", id).maybeSingle(),
    sb.from("university_specialties").select("specialty_slug,specialties(nom_ar)").eq("university_id", id).order("specialty_slug"),
    getBacSeries(),
  ]);
  const university = uRes.data as { id: string; slug: string; name_ar: string } | null;
  if (!university) notFound();

  // PostgREST يقطع النتيجة عند 1000 صف: قراءة على دفعات
  const rows: any[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await sb.from("acceptance_rates")
      .select("id,specialty_slug,bac_branch,year,score,is_official,source_url,source_title,notes,updated_at")
      .eq("university_id", id).order("id").range(from, from + 999);
    if (error) break;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const initial: RateRecord[] = rows.map((r) => ({ ...r, score: r.score === null ? null : Number(r.score) }));
  const specialties = ((linksRes.data ?? []) as any[]).map((l) => ({
    slug: l.specialty_slug as string,
    name: ((Array.isArray(l.specialties) ? l.specialties[0]?.nom_ar : l.specialties?.nom_ar) as string | undefined) ?? l.specialty_slug,
  }));
  const names = series.map((s) => s.name_ar);
  const branches = [...names, ...Array.from(new Set(initial.map((r) => r.bac_branch))).filter((b) => !names.includes(b))];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/universities/${id}`} className="text-sm text-blue-600">← {university.name_ar}</Link>
        <h1 className="section-title mt-2">معدلات القبول: {university.name_ar}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400">
          انقر على أي خانة لتعديل المعدل (Enter أو الخروج من الحقل = حفظ، Esc = إلغاء). الفاصلة العشرية «15,25» مقبولة. زر × يحذف السجل، وزر التفاصيل يضيف المصدر ويحدد السجل «رسمياً». لرفع دفعة كبيرة استعمل ملف JSON من «استيراد وتصدير».
        </p>
      </div>
      <RatesEditor universityId={id} specialties={specialties} branches={branches} years={years} initial={initial} />
    </div>
  );
}
