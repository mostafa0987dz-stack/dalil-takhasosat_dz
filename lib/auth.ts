import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const COOKIE = "admin_token";
export function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
}
export async function getAdminEmail(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = cookies().get(COOKIE)?.value;
  if (!url || !anon || !token || token.length > 8192) return null;
  try {
    const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.getUser(token);
    const email = data.user?.email?.trim().toLowerCase();
    if (error || !email || !allowedEmails().includes(email)) return null;
    return email;
  } catch { return null; }
}
export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) redirect("/admin/login");
  return email;
}
