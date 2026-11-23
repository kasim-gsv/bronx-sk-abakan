/**
 * Деплой превью на Render через публичный API.
 *
 * Запуск:
 *   RENDER_API_KEY=... GITHUB_REPO=https://github.com/user/repo \
 *   GITHUB_BRANCH=main node scripts/deploy-render.mjs
 *
 * Что делает:
 *  1. находит workspace (ownerId);
 *  2. создаёт web service на free-плане из публичного Git-репозитория;
 *  3. ждёт, пока Render выдаст адрес, и прописывает NEXT_PUBLIC_SITE_URL;
 *  4. запускает сборку и ждёт статус live;
 *  5. печатает ссылку и адрес дашборда.
 *
 * Секреты не логируются.
 */
const API = "https://api.render.com/v1";
const SERVICE_NAME = process.env.SERVICE_NAME ?? "bronx-preview";
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const KEY = process.env.RENDER_API_KEY;

if (!KEY || !REPO) {
  console.error(
    "Нужны RENDER_API_KEY и GITHUB_REPO (https://github.com/<user>/<repo>).",
  );
  process.exit(1);
}

async function api(path, init = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${path} → ${response.status}: ${text.slice(0, 600)}`,
    );
  }
  return text ? JSON.parse(text) : null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const owners = await api("/owners?limit=1");
const ownerId = owners?.[0]?.owner?.id ?? owners?.[0]?.id;
if (!ownerId) throw new Error("Не удалось получить ownerId из /owners");
console.log(`[deploy] workspace: ${ownerId}`);

const existing = await api("/services?limit=100");
const already = (existing ?? []).find(
  (entry) => (entry.service ?? entry).name === SERVICE_NAME,
);

let service = already ? (already.service ?? already) : null;

if (!service) {
  const created = await api("/services", {
    method: "POST",
    body: JSON.stringify({
      type: "web_service",
      name: SERVICE_NAME,
      ownerId,
      repo: REPO,
      branch: BRANCH,
      autoDeployTrigger: "off",
      serviceDetails: {
        runtime: "node",
        plan: "free",
        region: "frankfurt",
        envSpecificDetails: {
          buildCommand:
            "npm ci --include=dev && npm run build && npm run seed",
          startCommand: "npm start",
        },
      },
      envVars: [
        { key: "AUTH_SECRET", generateValue: true },
        { key: "DATABASE_PATH", value: "./data/bronx.db" },
        { key: "SEED_DEMO", value: "1" },
        { key: "ALLOW_DEV_LOGIN", value: "0" },
        { key: "NODE_VERSION", value: "24" },
        { key: "NEXT_TELEMETRY_DISABLED", value: "1" },
      ],
    }),
  });

  service = created.service;
  console.log(`[deploy] создан сервис: ${service.id}`);
} else {
  console.log(`[deploy] сервис уже существует: ${service.id}`);
}

// Адрес появляется вместе с сервисом (slug), но иногда чуть позже.
let slug = service.slug;
let siteUrl = service.serviceDetails?.url;

for (let attempt = 0; attempt < 20 && !siteUrl; attempt += 1) {
  await sleep(3000);
  const fresh = await api(`/services/${service.id}`);
  slug = fresh.slug ?? slug;
  siteUrl = fresh.serviceDetails?.url;
}

if (!slug) throw new Error("Render не вернул slug сервиса");

siteUrl = siteUrl ?? `https://${slug}.onrender.com`;
console.log(`[deploy] адрес: ${siteUrl}`);

const envVars = [
  { key: "NEXT_PUBLIC_SITE_URL", value: siteUrl },
  { key: "DATABASE_PATH", value: "./data/bronx.db" },
  { key: "SEED_DEMO", value: "1" },
  { key: "ALLOW_DEV_LOGIN", value: "0" },
  { key: "NODE_VERSION", value: "24" },
  { key: "NEXT_TELEMETRY_DISABLED", value: "1" },
];

await api(`/services/${service.id}/env-vars`, {
  method: "PUT",
  body: JSON.stringify(envVars),
});
console.log("[deploy] переменные окружения обновлены");

const deploy = await api(`/services/${service.id}/deploys`, {
  method: "POST",
  body: JSON.stringify({ clearCache: "do_not_clear" }),
});

// Render иногда отвечает 201 с пустым телом — тогда берём свежий деплой списком.
let deployId = deploy?.id ?? deploy?.deploy?.id;
if (!deployId) {
  const latest = await api(`/services/${service.id}/deploys?limit=1`);
  deployId = latest?.[0]?.deploy?.id;
}
if (!deployId) throw new Error("Не удалось определить id запущенной сборки");

console.log(`[deploy] сборка запущена: ${deployId}`);

let status = "created";
for (let attempt = 0; attempt < 120; attempt += 1) {
  await sleep(5000);
  const current = await api(`/services/${service.id}/deploys/${deployId}`);
  const next = current.status ?? current.deploy?.status;
  if (next !== status) {
    status = next;
    console.log(`[deploy] статус: ${status}`);
  }
  if (status === "live") break;
  if (status === "build_failed" || status === "canceled" || status === "failed") {
    throw new Error(`Сборка завершилась со статусом ${status}`);
  }
}

if (status !== "live") {
  throw new Error(`Сборка не завершилась за отведённое время (статус ${status})`);
}

console.log("");
console.log(`Готово: ${siteUrl}`);
console.log(`Дашборд: ${service.dashboardUrl ?? "https://dashboard.render.com"}`);
