export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="جارٍ التحميل">
      <div className="h-9 w-48 animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />)}</div>
      <div className="h-64 animate-pulse rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />
    </div>
  );
}
