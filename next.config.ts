import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  // Проверка типов вынесена в шаг `prebuild` (см. package.json): `next build`
  // запускает tsc дочерним процессом, что в ограниченных средах падает с
  // spawn EPERM. Сам `npm run build` при этом типы всё равно проверяет.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Базовые заголовки безопасности. CSP не задаём: у Next.js инлайновые
  // скрипты гидрации, для строгой политики нужны nonce и отдельный этап.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
