import type { Metadata } from "next";

export const metadata: Metadata = { title: "سياسة الخصوصية" };

export default function Privacy() {
  return (
    <section className="container-page max-w-3xl py-14">
      <h1 className="section-title mb-6">سياسة الخصوصية</h1>
      <div className="space-y-4 leading-8 text-slate-700 dark:text-slate-300">
        <p>لا يطلب الموقع إنشاء حساب للزوار، ولا يرسل علامات المستخدم إلى أي خادم. تتم حسابات المعدل داخل المتصفح فقط.</p>
        <p>يستخدم الموقع التخزين المحلي في المتصفح لحفظ تفضيل الوضع الليلي وقائمة التخصصات المفضلة فقط، ويمكنك مسحها في أي وقت من إعدادات المتصفح.</p>
        <p>عند إضافة خدمات تحليل أو حسابات في المستقبل يجب تحديث هذه السياسة بوضوح.</p>
      </div>
    </section>
  );
}
