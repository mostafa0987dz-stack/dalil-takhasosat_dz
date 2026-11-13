/** يُدرج بيانات منظمة JSON-LD. نهرب < لمنع إغلاق وسم script من داخل المحتوى. */
export default function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
