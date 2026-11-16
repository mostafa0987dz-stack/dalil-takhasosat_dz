export default function Loading() {
  return (
    <div className="container-page py-12" role="status" aria-label="جارٍ التحميل">
      <div className="mb-8 h-9 w-56 animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800" />
      <div className="mb-6 h-12 w-full max-w-xl animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />)}
      </div>
    </div>
  );
}
