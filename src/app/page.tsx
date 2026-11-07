import type { Metadata } from "next";
import { club } from "@/content/club";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Audiences } from "@/components/audiences";
import { Advantages } from "@/components/advantages";
import { Directions } from "@/components/directions";
import { Hall } from "@/components/hall";
import { Coaches } from "@/components/coaches";
import { Schedule } from "@/components/schedule";
import { Prices } from "@/components/prices";
import { Faq } from "@/components/faq";
import { Contacts } from "@/components/contacts";
import { SiteFooter } from "@/components/site-footer";
import { MobileActionBar } from "@/components/mobile-action-bar";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

function ClubJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["SportsActivityLocation", "LocalBusiness"],
    name: club.fullName,
    description: club.shortDescription,
    url: siteUrl,
    telephone: club.phone.tel,
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Тараса Шевченко, 62А",
      addressLocality: "Абакан",
      addressRegion: "Республика Хакасия",
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 53.7204,
      longitude: 91.4606,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "09:00",
        closes: "22:00",
      },
    ],
    sameAs: [club.links.vk, club.links.instagram],
    areaServed: { "@type": "City", name: "Абакан" },
    knowsAbout: [
      "ММА",
      "бокс",
      "бразильское джиу-джитсу",
      "грэпплинг",
      "вольная борьба",
      "кикбоксинг",
      "дзюдо",
      "рукопашный бой",
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD формируется из статических данных контента, а не из ввода пользователя.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <ClubJsonLd />
      <SiteHeader />
      <main>
        <Hero />
        <Audiences />
        <Advantages />
        <Directions />
        <Hall />
        <Coaches />
        <Schedule />
        <Prices />
        <Faq />
        <Contacts />
      </main>
      <SiteFooter />
      <MobileActionBar />
    </>
  );
}
