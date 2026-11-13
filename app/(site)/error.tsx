"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="container-page py-32 text-center">
      <h1 className="text-2xl font-black">حدث خطأ غير متوقع</h1>
      <button onClick={reset} className="btn-primary mt-8">إعادة المحاولة</button>
    </section>
  );
}
