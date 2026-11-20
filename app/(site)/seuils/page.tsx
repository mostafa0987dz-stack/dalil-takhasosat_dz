import { permanentRedirect } from "next/navigation";

/** صفحة العتبات المستقلة أُلغيت من القائمة: العتبات تُعرض داخل صفحات التخصصات والجامعات. البيانات محفوظة كما هي. */
export default function SeuilsPage() {
  permanentRedirect("/specialties");
}
