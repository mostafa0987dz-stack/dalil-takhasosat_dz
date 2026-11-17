import Link from "next/link";
import { Facebook, Instagram, Twitter, Send, Mail, Phone } from "lucide-react";

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const SOCIALS = [
  { label: "Facebook", href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK, Icon: Facebook, hover: "hover:bg-blue-600" },
  { label: "Instagram", href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, Icon: Instagram, hover: "hover:bg-pink-600" },
  { label: "Telegram", href: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM, Icon: Send, hover: "hover:bg-sky-500" },
  { label: "Twitter", href: process.env.NEXT_PUBLIC_SOCIAL_TWITTER, Icon: Twitter, hover: "hover:bg-slate-900" },
].flatMap(({ href, ...rest }) => (href ? [{ ...rest, href }] : []));

export default function Footer() {
  const copy = { intro:"مرجعك الأول لاكتشاف التخصصات الجامعية الجزائرية، مقارنة العتبات، وحساب معدلك الموزون بكل سهولة.", quick:"روابط سريعة", contact:"تواصل معنا", follow:"تابعنا", home:"الرئيسية", all:"جميع التخصصات", calc:"حاسبة المعدل", seuil:"عتبات القبول", compare:"مقارنة التخصصات", about:"عن الدليل", privacy:"الخصوصية", note:"البيانات إرشادية؛ المرجع النهائي هو منشور وزارة التعليم العالي." };
  return (
    <footer className="no-print mt-20 border-t border-white/60 bg-white/50 py-12 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50">
      <div className="container-page">
        {/* القسم العلوي: 4 أعمدة */}
        <div className="grid gap-8 md:grid-cols-4">
          
          {/* 1. معلومات الموقع */}
          <div className="md:col-span-1">
            <h3 className="mb-4 text-xl font-extrabold text-slate-900 dark:text-white">
              دليل التخصصات
            </h3>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
              {copy.intro}
            </p>
          </div>

          {/* 2. روابط سريعة */}
          <div>
            <h4 className="mb-4 font-bold text-slate-900 dark:text-white">{copy.quick}</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">{copy.home}</Link></li>
              <li><Link href="/specialties" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">{copy.all}</Link></li>
              <li><Link href="/calculator" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">{copy.calc}</Link></li>
              <li><Link href="/seuils" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">{copy.seuil}</Link></li>
              <li><Link href="/compare" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">{copy.compare}</Link></li>
            </ul>
          </div>

          {/* 3. معلومات التواصل (تظهر فقط عند ضبطها في متغيرات البيئة) */}
          {(CONTACT_EMAIL || CONTACT_PHONE) && (
            <div>
              <h4 className="mb-4 font-bold text-slate-900 dark:text-white">{copy.contact}</h4>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                {CONTACT_EMAIL && (
                  <li className="flex items-center gap-2">
                    <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                    <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">{CONTACT_EMAIL}</a>
                  </li>
                )}
                {CONTACT_PHONE && (
                  <li className="flex items-center gap-2">
                    <Phone size={16} className="text-blue-600 dark:text-blue-400" />
                    <a href={`tel:${CONTACT_PHONE.replace(/[^+\d]/g, "")}`} className="transition-colors hover:text-blue-600 dark:hover:text-blue-400" dir="ltr">{CONTACT_PHONE}</a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* 4. التواصل الاجتماعي (روابط حقيقية فقط) */}
          {SOCIALS.length > 0 && (
            <div>
              <h4 className="mb-4 font-bold text-slate-900 dark:text-white">{copy.follow}</h4>
              <div className="flex gap-3">
                {SOCIALS.map(({ label, href, Icon, hover }) => (
                  <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer" className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:-translate-y-1 hover:text-white dark:bg-slate-800 dark:text-slate-300 ${hover}`}>
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* القسم السفلي: الحقوق والملاحظات */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} دليل التخصصات الجامعية الجزائرية. جميع الحقوق محفوظة.</p>
          
          <div className="flex gap-5">
            <Link href="/about" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">{copy.about}</Link>
            <Link href="/privacy" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">{copy.privacy}</Link>
          </div>
          
          <p className="text-center md:text-left">
            {copy.note}
          </p>
        </div>
      </div>
    </footer>
  );
}
