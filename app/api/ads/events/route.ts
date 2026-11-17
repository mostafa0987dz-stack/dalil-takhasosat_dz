import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  // لا نقبل طلبات المتصفح القادمة من origins أخرى.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return NextResponse.json({ ok: false }, { status: 403 });
    } catch {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false }, { status: 400 });
  const { adId, eventType } = body as { adId?: unknown; eventType?: unknown };
  if (typeof adId !== "string" || !UUID.test(adId) || !["impression", "click"].includes(String(eventType))) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const { error } = await adminClient().rpc("record_ad_event", {
      p_ad_id: adId,
      p_event_type: eventType,
    });
    if (error) return new NextResponse(null, { status: 204 });
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    // غياب إعدادات Supabase أو عطل مؤقت: لا نُسقط الصفحة ولا نُرجع 500 لمجرد تتبع.
    return new NextResponse(null, { status: 204 });
  }
}
