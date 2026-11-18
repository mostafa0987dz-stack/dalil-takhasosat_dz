import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Building2, Calculator, GitCompare, ListChecks, Search, type LucideIcon } from "lucide-react";
import { getSpecialties } from "@/lib/data";
import { hasDemo } from "@/lib/specialty";
import { getBacSeries } from "@/lib/series";
import SpecialtyCard from "@/components/SpecialtyCard";
import HeroSearch from "@/components/HeroSearch";
import DomainIcon from "@/components/DomainIcon";
import AnimatedNumber from "@/components/AnimatedNumber";
import AdSlot from "@/components/AdSlot";
import { messages, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 600;
export const metadata: Metadata = { alternates: { canonical: `${SITE_URL}/` } };

export default async function Home() {
  const locale = "ar" as Locale; // FROZEN: واجهة عربية فقط (لا قراءة كوكيز)
  const t = messages[locale];
  const L = (ar: string, fr: string, en: string) => (locale === "fr" ? fr : locale === "en" ? en : ar);
  const tools: { t: string; d: string; u: string; Icon: LucideIcon }[] = [
    { t: t.calculator, d: t.calculatorDesc, u: "/calculator", Icon: Calculator },
    { t: t.thresholds, d: t.seuilDesc, u: "/seuils", Icon: ListChecks },
    { t: t.compare, d: t.compareDesc, u: "/compare", Icon: GitCompare },
    { t: t.series, d: t.seriesDesc, u: "/bac", Icon: BookOpen },
    { t: L("الجامعات", "Universités", "Universities"), d: L("تصفح الجامعات والتخصصات المتوفرة في كل منها ومعدلات القبول.", "Parcourez les universités, leurs spécialités et leurs seuils d’admission.", "Browse universities, their majors and admission scores."), u: "/universities", Icon: Building2 },
    { t: L("أين أقبل؟", "Où être admis ?", "Where can I get in?"), d: L("أدخل شعبتك ومعدلك لتعرف التخصصات والجامعات المناسبة.", "Saisissez votre filière et moyenne pour voir où vous pouvez être admis.", "Enter your stream and average to see where you can get in."), u: "/finder", Icon: Search },
  ];
  const [data, series] = await Promise.all([getSpecialties(), getBacSeries()]);
  const domains = Array.from(new Set(data.map((x) => x.domaine)));
  const stats = [
    { n: data.length, l: t.statsSpecialties },
    { n: series.length, l: t.statsSeries },
    { n: domains.length, l: t.statsDomains },
    { n: data.reduce((a, s) => a + s.seuils.length, 0), l: t.statsThresholds },
  ];
  
  return (
    <div>
      <section className="relative z-30 overflow-visible bg-gradient-to-bl from-blue-950 via-blue-800 to-indigo-700 py-12 text-white sm:py-20">
        {/* الزخارف داخل حاوية مقصوصة: لا تُنتج تمريراً أفقياً (كانت تُصغّر الصفحة في الهاتف) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl" />
          <div className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />
        </div>
        <div className="container-page relative z-10 grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">{t.heroTag}</span>
            <h1 className="mb-4 text-3xl font-black leading-tight sm:mb-5 sm:text-4xl md:text-6xl">{t.heroTitle1}<br />{t.heroTitle2}</h1>
            <p className="mb-6 max-w-xl leading-8 text-blue-100 sm:mb-8">{t.heroDesc}</p>
            <HeroSearch />
          </div>
          <div className="hidden rounded-3xl border border-white/25 bg-white/10 p-8 shadow-2xl backdrop-blur-xl md:block">
            <div className="grid grid-cols-2 gap-4">
              {domains.slice(0, 4).map((d) => (
                <Link key={d} href={`/specialties?d=${encodeURIComponent(d)}`} className="rounded-3xl border border-white/10 bg-white/10 p-6 transition hover:bg-white/25">
                  <div className="mb-3"><DomainIcon domaine={d} size={32} /></div>
                  <b>{d}</b>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-0"><AdSlot placement="home" /></div>
      <section className="container-page py-14">
        <p className="mb-2 text-sm font-bold text-blue-600">{t.start}</p>
        <h2 className="section-title mb-7">{t.toolsTitle}</h2>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map(({ t, d, u, Icon }, index) => {
            const colors = [
              { icon: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400", border: "hover:border-emerald-400 dark:hover:border-emerald-500/50" },
              { icon: "bg-amber-50 text-amber-600 group-hover:bg-amber-500 dark:bg-amber-950/50 dark:text-amber-400", border: "hover:border-amber-400 dark:hover:border-amber-500/50" },
              { icon: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 dark:bg-violet-950/50 dark:text-violet-400", border: "hover:border-violet-400 dark:hover:border-violet-500/50" },
              { icon: "bg-sky-50 text-sky-600 group-hover:bg-sky-600 dark:bg-sky-950/50 dark:text-sky-400", border: "hover:border-sky-400 dark:hover:border-sky-500/50" }
            ];
            const color = colors[index % colors.length];

            return (
              <Link 
                key={u} 
                href={u} 
                className={`group card card-hover relative overflow-hidden ${color.border}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10">
                  <div className={`mb-4 inline-flex rounded-xl p-3 transition-all duration-300 group-hover:scale-110 group-hover:text-white group-hover:shadow-lg ${color.icon}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="mb-2 text-lg font-extrabold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {t}
                  </h3>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {d}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-page pb-10" aria-labelledby="by-domain">
        <h2 id="by-domain" className="section-title mb-5">{L("تصفح حسب المجال", "Parcourir par domaine", "Browse by field")}</h2>
        <div className="flex flex-wrap gap-2">
          {domains.map((d) => <Link key={d} href={`/specialties?d=${encodeURIComponent(d)}`} prefetch={false} className="chip gap-2"><DomainIcon domaine={d} size={15} />{d}</Link>)}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="mb-7 flex items-center justify-between">
          <h2 className="section-title">{t.recommended}</h2>
          <Link href="/specialties" className="font-bold text-blue-600">{t.viewAll} ←</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.slice(0, 3).map((s) => <SpecialtyCard key={s.slug} item={s} />)}</div>
      </section>

      {/* قسم الإحصائيات مع الأرقام المتحركة */}
      <section className="container-page pb-4">
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-white shadow-glass backdrop-blur-xl md:grid-cols-4">
          {stats.map((x) => (
            <div key={x.l}>
              <div className="text-3xl font-black">
                <AnimatedNumber value={x.n} />
              </div>
              <div className="mt-2 text-sm text-slate-300">{x.l}</div>
            </div>
          ))}
        </div>
        {hasDemo(data) && <p className="mt-3 text-center text-sm text-slate-500">العتبات المعروضة تجريبية وليست رسمية.</p>}
      </section>
    </div>
  );
}
