import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = { title: "الأسئلة الشائعة", description: "أجوبة عن أسئلة شائعة حول معدلات القبول والبيانات وكيفية استعمال الدليل.", alternates: { canonical: `${SITE_URL}/faq` } };

const FAQ = [
  { q: "هل معدلات القبول المعروضة رسمية؟", a: "البيانات إرشادية ومجمّعة من مصادر منشورة، ويُذكر مصدر كل سجل كلما توفّر. المرجع النهائي هو منشور وزارة التعليم العالي والبحث العلمي ودليل التوجيه الجامعي للسنة المعنية." },
  { q: "كيف أعرف أين يكفيني معدلي؟", a: "استعمل صفحة «اكتشف تخصصك» أو «أين أقبل؟»: اختر شعبتك وأدخل معدلك، فتُعرض التخصصات والجامعات التي يكفيك فيها المعدل حسب آخر معدل قبول مسجّل." },
  { q: "هل تُرسل علاماتي إلى الخادم؟", a: "لا. حساب المعدل الموزون يتم داخل متصفحك فقط ولا تُحفظ العلامات." },
  { q: "لماذا تختلف معدلات القبول من سنة لأخرى؟", a: "تتغير حسب عدد المترشحين وعدد المقاعد وترتيب رغباتهم ونتائج البكالوريا، لذلك تُعرض لكل سنة على حدة ولا تُعدّ ضماناً للقبول." },
  { q: "وجدت خطأ في معلومة، كيف أبلّغ؟", a: "راسلنا عبر صفحة «اتصل بنا» مع رابط الصفحة والمعلومة الصحيحة ومصدرها إن أمكن." },
];

export default function FaqPage() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <section className="container-page max-w-3xl py-12">
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ name: "الرئيسية", href: "/" }, { name: "الأسئلة الشائعة" }]} />
      <h1 className="section-title mb-6">الأسئلة الشائعة</h1>
      <div className="space-y-3">
        {FAQ.map((f) => (
          <details key={f.q} className="card group !p-0">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 p-4 font-bold"><span>{f.q}</span><span aria-hidden className="text-slate-400 transition group-open:rotate-45">+</span></summary>
            <p className="px-4 pb-4 leading-8 text-slate-700 dark:text-slate-300">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
