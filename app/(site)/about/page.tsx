import type { Metadata } from "next";

export const metadata: Metadata = { title: "عن الدليل" };

export default function About() {
  return (
    <section className="container-page max-w-3xl py-14">
      <h1 className="section-title mb-6">عن الدليل</h1>
      <div className="space-y-5 leading-9 text-slate-700 dark:text-slate-300">
        <p>دليل التخصصات الجامعية الجزائرية مشروع معلوماتي يساعد حاملي شهادة البكالوريا والطلبة على استكشاف التخصصات ومجالاتها وآفاقها.</p>
        <p>المحتوى نموذج أولي، والعتبات المعلّمة بأنها تجريبية ليست بيانات رسمية. يجب استبدال عتبات القبول والجامعات بعروض التكوين والمنشورات الرسمية المحينة قبل الاعتماد عليها.</p>
      </div>
    </section>
  );
}
