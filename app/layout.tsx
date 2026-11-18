
import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import JsonLd from "@/components/JsonLd";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  applicationName: SITE_NAME,

  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },

  description:
    "اكتشف التخصصات الجامعية في الجزائر وشروط الالتحاق ومعدلات القبول والجامعات وآفاق الدراسة.",

  alternates: {
    canonical: "/",
  },

  // أيقونات الموقع
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icon.png", sizes: "512x512" },
    ],
  },

  // صورة المشاركة
  openGraph: {
    type: "website",
    locale: "ar_DZ",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      "دليلك لاكتشاف التخصصات الجامعية والجامعات ومعدلات القبول في الجزائر.",
    url: "/",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },

  // مشاركة Twitter و X
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "اكتشف التخصصات الجامعية والجامعات ومعدلات القبول في الجزائر.",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

// بيانات الموقع لمحركات البحث
const siteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: "دليل التخصصات",
  url: SITE_URL,
  inLanguage: "ar",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/specialties?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

// روابط التواصل الاجتماعي
const social = [
  process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
  process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
  process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM,
  process.env.NEXT_PUBLIC_SOCIAL_TWITTER,
].filter((x): x is string => Boolean(x));

// بيانات المنظمة
const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  ...(social.length ? { sameAs: social } : {}),
};

// تطبيق الوضع الليلي قبل عرض الصفحة
const themeScript = `(function(){
  try {
    var t = localStorage.getItem("theme");
    var d = t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", d);
  } catch(e) {}
})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>

      <body className={`${cairo.variable} min-h-screen font-sans antialiased`}>
        <JsonLd data={siteLd} />
        <JsonLd data={orgLd} />
        {children}
      </body>
    </html>
  );
}
