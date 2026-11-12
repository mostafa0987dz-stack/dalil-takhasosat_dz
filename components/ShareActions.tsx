"use client";
import { useState } from "react";
import { Printer, Share2 } from "lucide-react";

export default function ShareActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  return (
    <div className="no-print flex gap-2">
      <button onClick={share} className="btn-ghost"><Share2 size={16} />{copied ? "تم نسخ الرابط" : "مشاركة"}</button>
      <button onClick={() => window.print()} className="btn-ghost"><Printer size={16} />طباعة</button>
    </div>
  );
}
