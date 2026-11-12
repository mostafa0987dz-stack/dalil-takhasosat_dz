import Link from "next/link";
import { BookOpen, Calculator, GitCompare, ListChecks, type LucideIcon } from "lucide-react";
import { getSpecialties } from "@/lib/data";
import { hasDemo } from "@/lib/specialty";
import { SERIES } from "@/lib/constants";
import SpecialtyCard from "@/components/SpecialtyCard";
import HeroSearch from "@/components/HeroSearch";
import DomainIcon from "@/components/DomainIcon";

export const revalidate = 600;

const tools: { t: string; d: string; u: string; Icon: LucideIcon }[] = [
  { t: "حاسبة المعدل", d: "قارن معدلك بعتبات التخصصات حسب شعبتك.", u: "/calculator", Icon: Calculator },
  { t: "عتبات القبول", d: "جدول قابل للبحث والترتيب حسب الشعبة والسنة.", u: "/seuils", Icon: ListChecks },
  { t: "مقارنة التخصصات", d: "قارن حتى 3 تخصصات جنباً إلى جنب.", u: "/compare", Icon: GitCompare },
  { t: "تخصصات كل شعبة", d: "اكتشف ما تفتحه لك شعبتك من تخصصات.", u: "/bac", Icon: BookOpen },
];

export default async function Home() {
  const data = await getSpecialties();
  const domains = Array.from(new Set(data.map((x) => x.domaine)));
  const stats = [
    { n: data.length, l: "تخصصاً في الدليل" },
    { n: SERIES.length, l: "شعب بكالوريا" },
    { n: domains.length, l: "مجالات دراسة" },
    { n: data.reduce((a, s) => a + s.seuils.length, 0), l: "عتبة مسجلة" },
  ];
  return (
    <div>
      <section className="bg-gradient-to-bl from-blue-950 via-blue-800 to-indigo-700 py-20 text-white">
        <div className="container-page grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm">مرجعك لاختيار التخصص الجامعي</span>
            <h1 className="mb-5 text-4xl font-black leading-tight md:text-6xl">اكتشف طريقك<br />نحو المستقبل</h1>
            <p className="mb-8 max-w-xl leading-8 text-blue-100">تعرّف على التخصصات الجامعية الجزائرية، شعب البكالوريا، مجالات الدراسة وآفاق العمل في مكان واحد.</p>
            <HeroSearch items={data.map(({ slug, nom_ar, nom_fr }) => ({ slug, nom_ar, nom_fr }))} />
          </div>
          <div className="hidden rounded-3xl border border-white/20 bg-white/10 p-8 md:block">
            <div className="grid grid-cols-2 gap-4">
              {domains.slice(0, 4).map((d) => (
                <Link key={d} href={`/specialties?d=${encodeURIComponent(d)}`} className="rounded-2xl bg-white/10 p-6 transition hover:bg-white/20">
                  <div className="mb-3"><DomainIcon domaine={d} size={32} /></div>
                  <b>{d}</b>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <p className="mb-2 text-sm font-bold text-blue-600">ابدأ من هنا</p>
        <h2 className="section-title mb-7">أدوات تساعدك في الاختيار</h2>
        
        {/* قسم الأدوات المحسن */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                className={`group card relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${color.border}`}
              >
                {/* خلفية متدرجة خفيفة عند التمرير */}
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

      <section className="container-page pb-16">
        <div className="mb-7 flex items-center justify-between">
          <h2 className="section-title">تخصصات مقترحة</h2>
          <Link href="/specialties" className="font-bold text-blue-600">عرض الكل ←</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.slice(0, 3).map((s) => <SpecialtyCard key={s.slug} item={s} />)}</div>
      </section>

      <section className="container-page pb-4">
        <div className="grid grid-cols-2 gap-4 rounded-3xl bg-slate-900 p-8 text-white md:grid-cols-4">
          {stats.map((x) => (
            <div key={x.l}><div className="text-3xl font-black">{x.n}</div><div className="mt-2 text-sm text-slate-300">{x.l}</div></div>
          ))}
        </div>
        {hasDemo(data) && <p className="mt-3 text-center text-sm text-slate-500">العتبات المعروضة تجريبية وليست رسمية.</p>}
      </section>
    </div>
  );
}
