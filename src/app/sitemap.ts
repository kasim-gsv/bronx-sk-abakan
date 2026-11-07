import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  // /privacy закрыта от индексации (noindex) — в карту сайта не включаем.
  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/schedule`,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
