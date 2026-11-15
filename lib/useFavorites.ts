"use client";
import { useCallback, useEffect, useState } from "react";

const KEY = "fav-specialties";
const EVT = "fav-change";

function read(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function useFavorites() {
  const [fav, setFav] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setFav(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const toggle = useCallback((slug: string) => {
    const cur = read();
    const next = cur.includes(slug) ? cur.filter((x) => x !== slug) : [...cur, slug];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new Event(EVT));
  }, []);
  return { fav, toggle };
}
