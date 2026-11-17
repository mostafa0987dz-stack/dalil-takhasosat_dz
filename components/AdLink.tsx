"use client";

import Link from "next/link";
import { trackAdClick } from "@/components/AdEvents";

export default function AdLink({ adId, href }: { adId: string; href: string }) {
  return (
    <Link href={href} target="_blank" rel="sponsored noopener noreferrer" onClick={() => trackAdClick(adId)} className="btn-ghost shrink-0">
      اكتشف المزيد
    </Link>
  );
}
