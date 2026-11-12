import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GitCompare } from "lucide-react";
import { getSpecialties, getSpecialty } from "@/lib/data";
import DomainIcon, { domainCls } from "@/components/DomainIcon";
import DemoNotice from "@/components/DemoNotice";
import FavoriteButton from "@/components/FavoriteButton";
import ShareActions from "@/components/ShareActions";
import SpecialtyCard from "@/components/SpecialtyCard";

export const revalidate = 600;

export async function generateStaticParams() {
  return (await getSpecialties()).map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await getSpecialty(params.slug);
  if (!s) return {};
  return { title: s.nom_ar, description: s.description_ar.slice(0, 160), openGraph: { title: s.nom_ar, description: s.description_ar.slice(0, 160) } };
}

export default async function SpecialtyDetails({ params }: { params: { slug: string } }) {
  const all = await getSpecialties();
  const s = all.find((x) => x.slug === params.slug);
  if (!s) notFound();
  const similar = all.filter((x) => x.slug !== s.slug && x.domaine === s.domaine).slice(0, 3);
  const demo = s.seuils.some((x) => x.demo);
  const seuils = [...s.seuils].sort((a, b) => b.annee - a.annee || a.serie.localeCompare(b.serie, "ar"));

  return (
    <article className="container-page max-w-5xl py-12">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/specialties" className="text-sm font-bold text-blue-600">← العودة إلى التخصصات</Link>
        <ShareActions title={s.nom_ar} />
      </div>

      <div className="rounded-3xl bg-gradient-to-bl from-blue-950 to-blue-700 p-8 text-white">
        <div className="flex items-start justify-between gap-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${domainCls(s.domaine)}`}><DomainIcon domaine={s.domaine} size={16} />{s.domaine}</span>
          <FavoriteButton slug={s.slug} className="bg-white/10 !text-white hover:!bg-white/20" />
        </div>
        <h1 className="my-3 text-4xl font-black">{s.nom_ar}</h1>
        <p className="text-blue-100">{s.nom_fr} · {s.diplome} · {s.duree}</p>
      </div>

      <nav aria-label="أقسام الصفحة" className="no-print my-6 flex gap-2 overflow-x-auto">
        {[["#about", "نبذة"], ["#skills", "المهارات والآفاق"], ["#seuils", "العتبات"], ["#unis", "الجامعات"]].map(([h, l]) => <a key={h} href={h} className="chip">{l}</a>)}
      </nav>

      <section id="about" className="scroll-mt-24 pb-8">
        <h2 className="mb-3 text-2xl font-black">نبذة عن التخصص</h2>
        <p className="leading-9 text-slate-700 dark:text-slate-300">{s.description_ar}</p>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400"><b>الشعب المؤهلة:</b> {s.filiere.join("، ")}</p>
      </section>

      <div id="skills" className="grid scroll-mt-24 gap-6 md:grid-cols-2">
        <section className="card p-6"><h2 className="mb-4 text-xl font-black">المهارات المكتسبة</h2>
          <ul className="list-inside list-disc space-y-3 text-slate-700 dark:text-slate-300">{s.competences.map((x) => <li key={x}>{x}</li>)}</ul></section>
        <section className="card p-6"><h2 className="mb-4 text-xl font-black">آفاق التوظيف</h2>
          <ul className="list-inside list-disc space-y-3 text-slate-700 dark:text-slate-300">{s.debouches.map((x) => <li key={x}>{x}</li>)}</ul></section>
      </div>

      <section id="seuils" className="scroll-mt-24 py-8">
        <h2 className="mb-4 text-2xl font-black">عتبات القبول حسب الشعبة</h2>
        {demo && <DemoNotice />}
        {seuils.length ? (
          <div className="overflow-x-auto rounded-2xl border dark:border-slate-800">
            <table className="w-full text-right">
              <thead className="bg-slate-100 dark:bg-slate-900"><tr><th scope="col" className="th">الشعبة</th><th scope="col" className="th">السنة</th><th scope="col" className="th">المعدل</th><th scope="col" className="th">ملاحظة</th></tr></thead>
              <tbody>
                {seuils.map((x) => (
                  <tr key={`${x.serie}-${x.annee}`} className="border-t dark:border-slate-800">
                    <td className="p-4">{x.serie}</td><td className="p-4">{x.annee}</td>
                    <td className="p-4 font-bold">{x.moyenne !== null ? x.moyenne.toFixed(2) : "غير متوفر"}</td>
                    <td className="p-4 text-sm text-amber-800 dark:text-amber-400">{x.remarque ?? "تحقق من المنشور الرسمي"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-slate-600 dark:text-slate-400">لا توجد عتبات مسجلة لهذا التخصص بعد.</p>}
      </section>

      <section id="unis" className="scroll-mt-24 pb-8">
        <h2 className="mb-4 text-2xl font-black">جامعات ومؤسسات مقترحة للبحث</h2>
        <div className="flex flex-wrap gap-2">{s.universites.map((x) => <span key={x} className="rounded-xl bg-slate-100 px-4 py-2 text-sm dark:bg-slate-800">{x}</span>)}</div>
      </section>

      <div className="no-print flex flex-wrap gap-3">
        <Link href={`/calculator?specialty=${s.slug}`} className="btn-primary">احسب معدلي لهذا التخصص</Link>
        <Link href={`/compare?s=${s.slug}`} className="btn-ghost"><GitCompare size={16} />قارن مع تخصصات أخرى</Link>
      </div>

      {similar.length > 0 && (
        <section className="no-print pt-12">
          <h2 className="mb-5 text-2xl font-black">تخصصات مشابهة</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{similar.map((x) => <SpecialtyCard key={x.slug} item={x} />)}</div>
        </section>
      )}
    </article>
  );
}
