import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { safeUrl } from "./markdown";

export type FooterLink = { label: string; href: string };
export type FooterSettings = {
  about: { description: string };
  quick: FooterLink[];
  help: FooterLink[];
  contact: { email: string; phone: string; address: string };
  social: { facebook: string; instagram: string; telegram: string; twitter: string; youtube: string };
  copyright: string;
  show: { about: boolean; quick: boolean; help: boolean; contact: boolean };
};

export const SOCIAL_LABELS: Record<keyof FooterSettings["social"], string> = { facebook: "فيسبوك", instagram: "إنستغرام", telegram: "تيليغرام", twitter: "إكس (تويتر)", youtube: "يوتيوب" };

export const DEFAULT_FOOTER: FooterSettings = {
  about: { description: "مرجعك لاكتشاف التخصصات والجامعات الجزائرية، ومقارنة معدلات القبول، وحساب معدلك الموزون. البيانات إرشادية والمرجع النهائي منشور وزارة التعليم العالي." },
  quick: [
    { label: "الرئيسية", href: "/" }, { label: "المدونة", href: "/blog" }, { label: "الجامعات", href: "/universities" },
    { label: "التخصصات", href: "/specialties" }, { label: "حاسبة المعدل", href: "/calculator" }, { label: "اكتشف تخصصك", href: "/discover" },
  ],
  help: [{ label: "الأسئلة الشائعة", href: "/faq" }, { label: "سياسة الخصوصية", href: "/privacy" }, { label: "شروط الاستخدام", href: "/terms" }, { label: "اتصل بنا", href: "/contact" }],
  contact: { email: "", phone: "", address: "" },
  social: { facebook: "", instagram: "", telegram: "", twitter: "", youtube: "" },
  copyright: "",
  show: { about: true, quick: true, help: true, contact: true },
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const links = (v: unknown, fallback: FooterLink[]): FooterLink[] => {
  if (!Array.isArray(v)) return fallback;
  return v.flatMap((x) => {
    if (!x || typeof x !== "object") return [];
    const label = str((x as any).label, 60), href = safeUrl(str((x as any).href, 500), { allowMail: true });
    return label && href ? [{ label, href }] : [];
  }).slice(0, 20);
};
const url = (v: unknown) => { const s = str(v, 500); return s && /^https?:\/\//i.test(s) && safeUrl(s) ? s : ""; };

/** يدمج الإعدادات المخزنة مع الافتراضية بعد تعقيمها (روابط آمنة فقط، أطوال محدودة). */
export function normalizeFooter(raw: unknown): FooterSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as any;
  const d = DEFAULT_FOOTER;
  return {
    about: { description: str(r.about?.description, 600) || d.about.description },
    quick: links(r.quick, d.quick),
    help: links(r.help, d.help),
    contact: { email: str(r.contact?.email, 120), phone: str(r.contact?.phone, 40), address: str(r.contact?.address, 200) },
    social: {
      facebook: url(r.social?.facebook), instagram: url(r.social?.instagram), telegram: url(r.social?.telegram),
      twitter: url(r.social?.twitter), youtube: url(r.social?.youtube),
    },
    copyright: str(r.copyright, 200),
    show: { about: r.show?.about !== false, quick: r.show?.quick !== false, help: r.show?.help !== false, contact: r.show?.contact !== false },
  };
}

async function load_getFooterSettings(): Promise<FooterSettings> {
  const base = normalizeFooter(undefined);
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL, k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!u || !k) return base;
  try {
    const sb = createClient(u, k, { auth: { persistSession: false } });
    const { data } = await sb.from("site_settings").select("value").eq("key", "footer").maybeSingle();
    return data?.value ? normalizeFooter(data.value) : base;
  } catch { return base; }
}
export const getFooterSettings = cache(load_getFooterSettings);
