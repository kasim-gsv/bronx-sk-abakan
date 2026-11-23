import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { club } from "@/content/club";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${club.fullName} — ${club.tagline}`,
    template: `%s — ${club.fullName}`,
  },
  description: club.shortDescription,
  keywords: [
    "ММА Абакан",
    "бокс Абакан",
    "БЖЖ Абакан",
    "грэпплинг Абакан",
    "клуб единоборств Абакан",
    "тренировки по ММА",
    "детские секции Абакан",
    "Бронкс",
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: club.fullName,
    title: `${club.fullName} — ${club.tagline}`,
    description: club.shortDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${club.fullName} — ${club.tagline}`,
    description: club.shortDescription,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-scroll-behavior: при client-side переходах Next делает прокрутку
    // мгновенной (иначе плавный скролл из globals.css оставляет новую страницу
    // на сохранённой позиции), а для якорей остаётся плавность.
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${oswald.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
