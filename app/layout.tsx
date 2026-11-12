import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "اكتشف التخصصات الجامعية في الجزائر وشروط الالتحاق وآفاق الدراسة.",
  openGraph: { type: "website", locale: "ar_DZ", siteName: SITE_NAME },
};

// يطبّق الوضع الليلي قبل الرسم لمنع الوميض
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${cairo.variable} min-h-screen font-sans antialiased`}>{children}</body>
    </html>
  );
}
