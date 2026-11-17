"use client";
import { useEffect, useState } from "react";

/**
 * يعرض الإعلان على نوع الجهاز المطلوب فقط (جوال: عرض ≤ 767px، مكتب: أعرض).
 * الفلترة هنا عند العميل حتى لا تحتاج الصفحة إلى قراءة user-agent (وإلا صارت ديناميكية).
 */
export default function AdDeviceGate({ only, children }: { only: "mobile" | "desktop"; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setShow(only === "mobile" ? mq.matches : !mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [only]);
  return show ? <>{children}</> : null;
}
