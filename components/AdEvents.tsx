"use client";

import { useEffect, useRef } from "react";

/** يسجل الظهور مرة واحدة لكل تحميل للمكوّن، والنقر عند انتقال الزائر للإعلان. */
export default function AdEvents({ adId }: { adId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch("/api/ads/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId, eventType: "impression" }),
      keepalive: true,
    }).catch(() => undefined);
  }, [adId]);

  return null;
}

export function trackAdClick(adId: string) {
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const body = new Blob([JSON.stringify({ adId, eventType: "click" })], { type: "application/json" });
    navigator.sendBeacon("/api/ads/events", body);
    return;
  }
  void fetch("/api/ads/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adId, eventType: "click" }),
    keepalive: true,
  }).catch(() => undefined);
}
