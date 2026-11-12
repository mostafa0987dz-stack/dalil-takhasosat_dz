"use client";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";

export default function FavoriteButton({ slug, className = "" }: { slug: string; className?: string }) {
  const { fav, toggle } = useFavorites();
  const on = fav.includes(slug);
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={on}
      aria-label={on ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      className={`rounded-full p-2 transition hover:bg-rose-50 dark:hover:bg-rose-950 ${on ? "text-rose-600" : "text-slate-400"} ${className}`}
    >
      <Heart size={18} className={on ? "fill-current" : ""} />
    </button>
  );
}
