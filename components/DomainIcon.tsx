import { BookOpen, Briefcase, Cpu, HeartPulse, Scale, type LucideIcon } from "lucide-react";

const META: Record<string, { Icon: LucideIcon; cls: string }> = {
  "علوم الصحة": { Icon: HeartPulse, cls: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  "علوم وتكنولوجيا": { Icon: Cpu, cls: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  "علوم إنسانية واجتماعية": { Icon: Scale, cls: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  "علوم اقتصادية وتجارية وتسيير": { Icon: Briefcase, cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
};
const FALLBACK = { Icon: BookOpen, cls: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" };

export const domainCls = (d: string) => (META[d] ?? FALLBACK).cls;

export default function DomainIcon({ domaine, size = 18 }: { domaine: string; size?: number }) {
  const { Icon } = META[domaine] ?? FALLBACK;
  return <Icon size={size} aria-hidden />;
}
