import Link from "next/link";

export default function Footer() {
  return (
    <footer className="no-print mt-20 border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
      <div className="container-page flex flex-col justify-between gap-4 text-sm text-slate-600 dark:text-slate-400 md:flex-row">
        <p>© {new Date().getFullYear()} دليل التخصصات الجامعية الجزائرية</p>
        <div className="flex gap-5">
          <Link href="/about" className="hover:text-blue-600">عن الدليل</Link>
          <Link href="/privacy" className="hover:text-blue-600">الخصوصية</Link>
        </div>
        <p>البيانات إرشادية؛ المرجع النهائي هو منشور وزارة التعليم العالي.</p>
      </div>
    </footer>
  );
}
