"use client";
import { useEffect, useState, useRef } from "react";

export default function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          const startTime = Date.now();
          const endTime = startTime + duration;

          const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1); // نسبة التقدم من 0 إلى 1

            // حساب القيمة الحالية باستخدام دالة تباطؤ آمنة
            const easeOut = 1 - Math.pow(1 - progress, 3);
            let current = Math.floor(easeOut * value);

            // حماية إضافية لمنع الأرقام السالبة أو التي تتجاوز القيمة النهائية
            if (current < 0) current = 0;
            if (current > value) current = value;

            setCount(current);

            if (now < endTime) {
              requestAnimationFrame(animate);
            } else {
              setCount(value); // تأكيد الوصول للرقم النهائي
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return <span ref={elementRef}>{count}</span>;
}
