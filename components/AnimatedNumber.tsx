"use client";
import { useEffect, useState, useRef } from "react";

export default function AnimatedNumber({ value, duration = 2500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // نستخدم IntersectionObserver لمراقبة متى يظهر العنصر في الشاشة
    const observer = new IntersectionObserver(
      (entries) => {
        // إذا ظهر العنصر في الشاشة ولم يكن قد تحرك من قبل
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          let startTime: number | null = null;
          let animationFrame: number;

          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            
            // دالة لجعل الحركة تتباطأ في النهاية (Ease-out)
            const easeOut = 1 - Math.pow(1 - progress / duration, 4);
            const current = Math.floor(easeOut * value);

            if (current < value) {
              setCount(current);
              animationFrame = requestAnimationFrame(animate);
            } else {
              setCount(value); // تأكيد الوصول للرقم النهائي
            }
          };

          animationFrame = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 } // يبدأ عندما يظهر 10% من العنصر في الشاشة
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    // تنظيف الذاكرة عند إغلاق المكون
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return <span ref={elementRef}>{count}</span>;
}
