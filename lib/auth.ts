import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const COOKIE = "admin_token";

export function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/** يتحقق من رمز الدخول مع Supabase ثم من أن البريد ضمن قائمة المشرفين. */
export async function getAdminEmail(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = cookies().get(COOKIE)?.value;
  if (!url || !anon || !token) return null;
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !email || !allowedEmails().includes(email)) return null;
  return email;
}

export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) redirect("/admin/login");
  return email;
}
