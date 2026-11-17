"use client";
import { useEffect, useRef, useState } from "react";

/** عدّاد متحرك عند ظهوره في الشاشة. يعرض القيمة النهائية عند عدم دعم الحركة أو عند تفضيل تقليلها. */
export default function AnimatedNumber({ value, duration = 1600 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(value); // القيمة النهائية أولاً: تظهر للزواحف ولمن عطّل JavaScript
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!el || reduce || typeof IntersectionObserver === "undefined") { setCount(value); return; }

    let raf = 0;
    setCount(0);
    done.current = false;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        setCount(Math.min(value, Math.floor((1 - Math.pow(1 - p, 3)) * value)));
        if (p < 1) raf = requestAnimationFrame(tick); else setCount(value);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !done.current) { done.current = true; io.disconnect(); run(); }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration]);

  return <span ref={ref} aria-label={String(value)}>{count}</span>;
}
