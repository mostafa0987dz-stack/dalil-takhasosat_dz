import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import JsonLd from "@/components/JsonLd";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8fafc" }, { media: "(prefers-color-scheme: dark)", color: "#020617" }],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "اكتشف التخصصات الجامعية في الجزائر وشروط الالتحاق وآفاق الدراسة.",
  // TODO: أضف الملف public/og-image.png (1200×630) قبل النشر؛ حتى يُضاف يعطي رابط الصورة 404.
  openGraph: { type: "website", locale: "ar_DZ", siteName: SITE_NAME, images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }] },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  robots: { index: true, follow: true },
};

// يطبّق الوضع الليلي قبل الرسم لمنع الوميض
const siteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "ar",
  potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/specialties?q={search_term_string}`, "query-input": "required name=search_term_string" },
};

// بيانات المنظمة (Organization). الشعار يشير إلى og-image.png (TODO: أضف الملف إلى public/).
const social = [process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK, process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM, process.env.NEXT_PUBLIC_SOCIAL_TWITTER].filter((x): x is string => Boolean(x));
const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.png`,
  ...(social.length ? { sameAs: social } : {}),
};

// لاحقاً (اختياري): لتوليد صورة المشاركة برمجياً أضف app/opengraph-image.tsx (next/og ImageResponse) بحجم 1200×630؛ وهو يتقدم على ملف public/og-image.png للمسارات التي يغطيها.

const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${cairo.variable} min-h-screen font-sans antialiased`}><JsonLd data={siteLd} /><JsonLd data={orgLd} />
        {children}
      </body>
    </html>
  );
}
