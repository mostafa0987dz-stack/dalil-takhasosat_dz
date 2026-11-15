"use client";
import { useState } from "react";
import { FileDown, Link2, MessageCircle, Printer, Send } from "lucide-react";

export default function ShareActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => window.location.href.split("#")[0];
  const text = () => `${title} — دليل التخصصات الجامعية الجزائرية`;

  function open(href: string) { window.open(href, "_blank", "noopener,noreferrer"); }
  const whatsapp = () => open(`https://wa.me/?text=${encodeURIComponent(`${text()}\n${url()}`)}`);
  const telegram = () => open(`https://t.me/share/url?url=${encodeURIComponent(url())}&text=${encodeURIComponent(text())}`);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="no-print flex flex-wrap gap-2" role="group" aria-label="مشاركة وتصدير">
      <button onClick={whatsapp} className="btn-ghost hover:!text-emerald-600"><MessageCircle size={16} />واتساب</button>
      <button onClick={telegram} className="btn-ghost hover:!text-sky-600"><Send size={16} />تيليجرام</button>
      <button onClick={copy} className="btn-ghost"><Link2 size={16} />{copied ? "تم نسخ الرابط" : "نسخ الرابط"}</button>
      <button onClick={() => window.print()} className="btn-ghost"><Printer size={16} />طباعة</button>
      <button onClick={() => window.print()} className="btn-ghost" title="في نافذة الطباعة اختر «حفظ بصيغة PDF»"><FileDown size={16} />حفظ PDF</button>
    </div>
  );
}
