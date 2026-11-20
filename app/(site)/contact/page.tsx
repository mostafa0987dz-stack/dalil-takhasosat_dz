import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getFooterSettings, SOCIAL_LABELS, type FooterSettings } from "@/lib/footer";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 600;
export const metadata: Metadata = { title: "اتصل بنا", description: "طرق التواصل مع فريق دليل التخصصات الجامعية الجزائرية.", alternates: { canonical: `${SITE_URL}/contact` } };

export default async function ContactPage() {
  const f = await getFooterSettings();
  const social = (Object.keys(f.social) as (keyof FooterSettings["social"])[]).filter((k) => f.social[k]);
  const any = f.contact.email || f.contact.phone || f.contact.address || social.length > 0;
  return (
    <section className="container-page max-w-2xl py-12">
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: "اتصل بنا" }]} />
      <h1 className="section-title mb-4">اتصل بنا</h1>
      <p className="mb-6 leading-8 text-slate-600 dark:text-slate-400">للإبلاغ عن خطأ في معلومة أو اقتراح تحسين، اذكر رابط الصفحة والمعلومة الصحيحة ومصدرها إن أمكن.</p>
      {any ? (
        <ul className="card space-y-3">
          {f.contact.email && <li><b>البريد الإلكتروني: </b><a dir="ltr" className="text-blue-600" href={`mailto:${f.contact.email}`}>{f.contact.email}</a></li>}
          {f.contact.phone && <li><b>الهاتف: </b><a dir="ltr" className="text-blue-600" href={`tel:${f.contact.phone.replace(/\s/g, "")}`}>{f.contact.phone}</a></li>}
          {f.contact.address && <li><b>العنوان: </b>{f.contact.address}</li>}
          {social.map((k) => <li key={k}><b>{SOCIAL_LABELS[k]}: </b><a dir="ltr" className="text-blue-600" href={f.social[k]} target="_blank" rel="noopener noreferrer">{f.social[k].replace(/^https?:\/\//, "")}</a></li>)}
        </ul>
      ) : <p className="card text-slate-600 dark:text-slate-400">لم تُضبط وسائل التواصل بعد.</p>}
    </section>
  );
}
