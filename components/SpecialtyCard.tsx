import Link from "next/link";
import type { Specialty } from "@/types";
import { minSeuil } from "@/lib/specialty";
import DomainIcon, { domainCls } from "./DomainIcon";
import FavoriteButton from "./FavoriteButton";

export default function SpecialtyCard({ item }: { item: Specialty }) {
  const min = minSeuil(item);

  return (
    <div className="group relative h-full">
      <Link
        href={`/specialties/${item.slug}`}
        className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50 dark:hover:shadow-blue-900/20"
      >
        <div>
          {/* الشارة (Tag) أصبحت أكثر وضوحاً */}
          <span className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition-colors ${domainCls(item.domaine)}`}>
            <DomainIcon domaine={item.domaine} size={14} />
            {item.domaine}
          </span>

          <h3 className="mb-1 text-xl font-extrabold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            {item.nom_ar}
          </h3>
          
          {item.nom_fr && (
            <p dir="ltr" className="mb-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
              {item.nom_fr}
            </p>
          )}
          
          <p className="mb-6 line-clamp-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
            {item.description_ar}
          </p>
        </div>

        {/* تذييل البطاقة (الشهادة والعتبة) */}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span className="font-medium">{item.diplome} · {item.duree}</span>
          {min !== null && (
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              من {min.toFixed(2)}
            </span>
          )}
        </div>
      </Link>
      
      {/* زر المفضلة يظهر بشكل أنيق في الزاوية */}
      <FavoriteButton slug={item.slug} className="absolute left-3 top-3 z-10" />
    </div>
  );
}
