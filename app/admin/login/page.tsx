import LoginForm from "@/components/admin/LoginForm";
import { hasSupabase } from "@/lib/data";

export default function LoginPage() {
  return (
    <section className="container-page max-w-md py-24">
      <h1 className="section-title mb-2">دخول المشرف</h1>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">لوحة إدارة محتوى دليل التخصصات.</p>
      {hasSupabase ? <LoginForm /> : (
        <p className="rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          لم يتم ضبط Supabase بعد. أنشئ ملف <code dir="ltr">.env.local</code> من <code dir="ltr">.env.example</code> واتبع خطوات README.
        </p>
      )}
    </section>
  );
}
