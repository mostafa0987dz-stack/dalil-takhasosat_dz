import { adminClient } from "./supabase";

/** سجل العمليات الإدارية (audit_log). لا يُفشل العملية إن تعذّر التسجيل. */
export async function auditLog(email: string, action: string, ref?: string) {
  try { await adminClient().from("audit_log").insert({ admin_email: email, action, slug: ref ?? null }); } catch { /* تجاهل */ }
}
