// FROZEN: multilingual UI disabled temporarily (see SITE_DOCUMENTATION).
// To restore: re-enable getLocale() in app/layout.tsx and Header language selector.
import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const locale = body?.locale;
  if (!(["ar", "fr", "en"] as string[]).includes(locale)) return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("site_locale", locale, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}
