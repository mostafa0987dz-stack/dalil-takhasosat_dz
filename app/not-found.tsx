import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-page py-32 text-center">
      <p className="text-6xl font-black text-blue-600">404</p>
      <h1 className="mt-4 text-2xl font-black">الصفحة غير موجودة</h1>
      <Link href="/" className="btn-primary mt-8">العودة إلى الرئيسية</Link>
    </section>
  );
}
