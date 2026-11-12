import Link from "next/link";
import type { Specialty } from "@/types";
import { minSeuil } from "@/lib/specialty";
import DomainIcon, { domainCls } from "./DomainIcon";
import FavoriteButton from "./FavoriteButton";

export default function SpecialtyCard({ item }: { item: Specialty }) {
  const min = minSeuil(item);
  return (
    <div className="group relative">
      <Link
        href={`/specialties/${item.slug}`}
        className="card block h-full transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:hover:border-blue-700"
      >
        <span className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${domainCls(item.domaine)}`}>
          <DomainIcon domaine={item.domaine} size={14} />
          {item.domaine}
        </span>
        <h3 className="mb-1 text-xl font-extrabold group-hover:text-brand-700 dark:group-hover:text-blue-400">{item.nom_ar}</h3>
        {item.nom_fr && <p dir="ltr" className="mb-3 text-right text-xs text-slate-500 dark:text-slate-400">{item.nom_fr}</p>}
        <p className="mb-4 line-clamp-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{item.description_ar}</p>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{item.diplome} · {item.duree}</span>
          {min !== null && <span className="rounded-full bg-slate-100 px-2 py-1 font-bold dark:bg-slate-800">من {min.toFixed(2)}</span>}
        </div>
      </Link>
      <FavoriteButton slug={item.slug} className="absolute left-3 top-3" />
    </div>
  );
}
