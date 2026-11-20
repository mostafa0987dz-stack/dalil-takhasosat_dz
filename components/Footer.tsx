import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Send, Twitter, Youtube } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { getFooterSettings, SOCIAL_LABELS, type FooterSettings } from "@/lib/footer";

const ICONS: Record<keyof FooterSettings["social"], typeof Facebook> = { facebook: Facebook, instagram: Instagram, telegram: Send, twitter: Twitter, youtube: Youtube };

export default async function Footer() {
  const f = await getFooterSettings();
  const social = (Object.keys(f.social) as (keyof FooterSettings["social"])[]).filter((k) => f.social[k]);
  const hasContact = Boolean(f.contact.email || f.contact.phone || f.contact.address || social.length);
  const sections = [f.show.about, f.show.quick, f.show.help, f.show.contact && hasContact].filter(Boolean).length;
  const linkCls = "inline-flex min-h-8 items-center text-slate-600 hover:text-blue-600 dark:text-slate-400";
  const list = (items: { label: string; href: string }[]) => (
    <ul className="space-y-1.5 text-sm">
      {items.map((l) => <li key={`${l.label}-${l.href}`}>{/^https?:/i.test(l.href) ? <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkCls}>{l.label}</a> : <Link href={l.href} prefetch={false} className={linkCls}>{l.label}</Link>}</li>)}
    </ul>
  );
  return (
    <footer className="mt-20 border-t border-slate-200/70 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60">
      <div className={`container-page grid gap-10 py-12 sm:grid-cols-2 ${sections >= 4 ? "lg:grid-cols-4" : sections === 3 ? "lg:grid-cols-3" : ""}`}>
        {f.show.about && (
          <section aria-labelledby="ft-about">
            <h2 id="ft-about" className="mb-3 text-lg font-black text-brand-700 dark:text-blue-400">{SITE_NAME}</h2>
            <p className="text-sm leading-8 text-slate-600 dark:text-slate-400">{f.about.description}</p>
          </section>
        )}
        {f.show.quick && f.quick.length > 0 && <nav aria-labelledby="ft-quick"><h2 id="ft-quick" className="mb-3 font-black">روابط مهمة</h2>{list(f.quick)}</nav>}
        {f.show.help && f.help.length > 0 && <nav aria-labelledby="ft-help"><h2 id="ft-help" className="mb-3 font-black">المساعدة</h2>{list(f.help)}</nav>}
        {f.show.contact && hasContact && (
          <section aria-labelledby="ft-contact">
            <h2 id="ft-contact" className="mb-3 font-black">التواصل</h2>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {f.contact.email && <li className="flex items-center gap-2"><Mail size={15} aria-hidden /><a dir="ltr" href={`mailto:${f.contact.email}`} className="hover:text-blue-600">{f.contact.email}</a></li>}
              {f.contact.phone && <li className="flex items-center gap-2"><Phone size={15} aria-hidden /><a dir="ltr" href={`tel:${f.contact.phone.replace(/\s/g, "")}`} className="hover:text-blue-600">{f.contact.phone}</a></li>}
              {f.contact.address && <li className="flex items-center gap-2"><MapPin size={15} aria-hidden />{f.contact.address}</li>}
            </ul>
            {social.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="روابط التواصل الاجتماعي">
                {social.map((k) => { const Icon = ICONS[k]; return <li key={k}><a href={f.social[k]} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABELS[k]} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200/70 hover:bg-white dark:border-slate-700/70 dark:hover:bg-slate-800"><Icon size={18} aria-hidden /></a></li>; })}
              </ul>
            )}
          </section>
        )}
      </div>
      <div className="border-t border-slate-200/70 py-5 text-center text-xs text-slate-500 dark:border-slate-800">
        {f.copyright || `© ${new Date().getFullYear()} ${SITE_NAME}. جميع الحقوق محفوظة.`}
      </div>
    </footer>
  );
}
