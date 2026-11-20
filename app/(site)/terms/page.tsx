import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = { title: "شروط الاستخدام", description: "شروط استخدام موقع دليل التخصصات الجامعية الجزائرية.", alternates: { canonical: `${SITE_URL}/terms` } };

export default function TermsPage() {
  return (
    <section className="container-page max-w-3xl py-12">
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: "شروط الاستخدام" }]} />
      <h1 className="section-title mb-6">شروط الاستخدام</h1>
      <div className="space-y-5 leading-9 text-slate-700 dark:text-slate-300">
        <p>باستعمالك هذا الموقع فإنك توافق على الشروط التالية.</p>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">طبيعة المعلومات</h2>
        <p>المعلومات المعروضة إرشادية لمساعدتك على التوجيه، ولا تُغني عن المنشورات الرسمية لوزارة التعليم العالي والبحث العلمي. لا نضمن خلوها من الأخطاء أو حداثتها الدائمة، ولا يُعدّ أي معدل قبول سابق وعداً بالقبول.</p>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">المسؤولية</h2>
        <p>يتحمل المستخدم مسؤولية قراراته الدراسية. ولا يتحمل الموقع أي ضرر ناتج عن الاعتماد على المعلومات دون التحقق من المصادر الرسمية.</p>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">الروابط والإعلانات</h2>
        <p>قد يحتوي الموقع على روابط لمواقع خارجية وعلى إعلانات أو محتوى مدعوم يُوسَم بوضوح. لا نتحكم في محتوى المواقع الخارجية ولا نتحمل مسؤوليته.</p>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">الملكية والاستخدام</h2>
        <p>يمكنك الاطلاع على المحتوى وطباعته للاستعمال الشخصي. يُمنع نسخه أو إعادة نشره تجارياً دون إذن. يُمنع استعمال الموقع بطريقة تعطّله أو تجمع بياناته آلياً بشكل مفرط.</p>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">التعديل</h2>
        <p>قد نُحدّث هذه الشروط من وقت لآخر، واستمرارك في الاستعمال يعني قبولك بالنسخة المحدّثة.</p>
      </div>
    </section>
  );
}
