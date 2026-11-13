import Link from "next/link";
import type { Specialty } from "@/types";
import { minSeuil } from "@/lib/specialty";
import DomainIcon, { domainCls } from "./DomainIcon";
import FavoriteButton from "./FavoriteButton";

export default function SpecialtyCard({ item, asPreview = false }: { item: Pick<Specialty, "slug" | "nom_ar" | "nom_fr" | "domaine" | "description_ar" | "diplome" | "duree" | "seuils">; asPreview?: boolean }) {
  const min = minSeuil(item as Specialty);
  const inner = (
    <>
      <div>
        <span className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${domainCls(item.domaine)}`}>
          <DomainIcon domaine={item.domaine} size={14} />
          {item.domaine || "—"}
        </span>
        <h3 className="mb-1 text-xl font-extrabold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">{item.nom_ar || "اسم التخصص"}</h3>
        {item.nom_fr && <p dir="ltr" className="mb-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">{item.nom_fr}</p>}
        <p className="mb-6 line-clamp-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{item.description_ar}</p>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-slate-200/60 pt-4 text-xs text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
        <span className="font-medium">{item.diplome} · {item.duree}</span>
        {min !== null && <span className="rounded-xl bg-blue-100/70 px-2.5 py-1 font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">من {min.toFixed(2)}</span>}
      </div>
    </>
  );
  const cls = "card card-hover flex h-full flex-col justify-between";
  return (
    <div className="group relative h-full">
      {asPreview ? <div className={cls}>{inner}</div> : <Link href={`/specialties/${item.slug}`} className={cls}>{inner}</Link>}
      {!asPreview && <FavoriteButton slug={item.slug} className="absolute left-3 top-3 z-10" />}
    </div>
  );
}
