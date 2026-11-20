import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import { normalizeFooter } from "@/lib/footer";
import FooterForm from "@/components/admin/FooterForm";

export const dynamic = "force-dynamic";
export default async function AdminFooterPage() {
  await requireAdmin();
  const { data } = await adminClient().from("site_settings").select("value").eq("key", "footer").maybeSingle();
  return <div className="space-y-6"><div><h1 className="section-title">الفوتر</h1><p className="mt-2 text-sm text-slate-500">يُحفظ في إعدادات الموقع ويظهر في كل الصفحات. لا تُعرض وسائل تواصل غير مُدخلة.</p></div><FooterForm value={normalizeFooter(data?.value)} /></div>;
}
