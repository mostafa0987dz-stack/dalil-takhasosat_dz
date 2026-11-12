"use client";
import { useEffect, useState } from "react";

export default function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      // دالة رياضية لجعل الحركة تتباطأ في النهاية (Ease-out)
      const easeOut = 1 - Math.pow(1 - progress / duration, 3);
      const current = Math.floor(easeOut * value);

      if (current < value) {
        setCount(current);
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count.toLocaleString("ar-DZ")}</span>;
}
