import { requireAdmin } from "@/lib/auth";
import { adminClient } from "@/lib/supabase";
import SettingsForm from "@/components/admin/SettingsForm";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  await requireAdmin();
  const { data } = await adminClient().from("site_settings").select("value").eq("key", "general").maybeSingle();
  return <div className="space-y-6"><div><h1 className="section-title">إعدادات الموقع</h1><p className="mt-2 text-sm text-slate-500">الهوية واللغات وسياسة الإعلانات.</p></div><SettingsForm initial={data?.value ?? null}/></div>;
}
