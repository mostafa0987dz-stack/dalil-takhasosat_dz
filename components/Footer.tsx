import Link from "next/link";
import { Facebook, Instagram, Twitter, Send, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="no-print mt-20 border-t border-white/60 bg-white/50 py-12 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50">
      <div className="container-page">
        {/* القسم العلوي: 4 أعمدة */}
        <div className="grid gap-8 md:grid-cols-4">
          
          {/* 1. معلومات الموقع */}
          <div className="md:col-span-1">
            <h3 className="mb-4 text-xl font-extrabold text-slate-900 dark:text-white">
              دليل التخصصات
            </h3>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
              مرجعك الأول لاكتشاف التخصصات الجامعية الجزائرية، مقارنة العتبات، وحساب معدلك الموزون بكل سهولة.
            </p>
          </div>

          {/* 2. روابط سريعة */}
          <div>
            <h4 className="mb-4 font-bold text-slate-900 dark:text-white">روابط سريعة</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">الرئيسية</Link></li>
              <li><Link href="/specialties" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">جميع التخصصات</Link></li>
              <li><Link href="/calculator" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">حاسبة المعدل</Link></li>
              <li><Link href="/seuils" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">عتبات القبول</Link></li>
              <li><Link href="/compare" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">مقارنة التخصصات</Link></li>
            </ul>
          </div>

          {/* 3. معلومات التواصل */}
          <div>
            <h4 className="mb-4 font-bold text-slate-900 dark:text-white">تواصل معنا</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                <a href="mailto:contact@example.com" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">contact@example.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-blue-600 dark:text-blue-400" />
                <a href="tel:+213000000000" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400" dir="ltr">+213 (0) 000 00 00 00</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                <span>الجزائر العاصمة، الجزائر</span>
              </li>
            </ul>
          </div>

          {/* 4. التواصل الاجتماعي */}
          <div>
            <h4 className="mb-4 font-bold text-slate-900 dark:text-white">تابعنا</h4>
            <div className="flex gap-3">
              <a href="#" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:-translate-y-1 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-300">
                <Facebook size={18} />
              </a>
              <a href="#" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:-translate-y-1 hover:bg-pink-600 hover:text-white dark:bg-slate-800 dark:text-slate-300">
                <Instagram size={18} />
              </a>
              <a href="#" aria-label="Telegram" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:-translate-y-1 hover:bg-sky-500 hover:text-white dark:bg-slate-800 dark:text-slate-300">
                <Send size={18} />
              </a>
              <a href="#" aria-label="Twitter" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:-translate-y-1 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:text-slate-300">
                <Twitter size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* القسم السفلي: الحقوق والملاحظات */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} دليل التخصصات الجامعية الجزائرية. جميع الحقوق محفوظة.</p>
          
          <div className="flex gap-5">
            <Link href="/about" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">عن الدليل</Link>
            <Link href="/privacy" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">الخصوصية</Link>
          </div>
          
          <p className="text-center md:text-left">
            البيانات إرشادية؛ المرجع النهائي هو منشور وزارة التعليم العالي.
          </p>
        </div>
      </div>
    </footer>
  );
}
