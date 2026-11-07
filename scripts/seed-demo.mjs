/**
 * Демо-данные для превью: три занятия на ближайшие дни.
 *
 * Запускается только при SEED_DEMO=1 и только если занятий ещё нет.
 * Нужен, чтобы владелец клуба на превью увидел расписание, а не пустую
 * страницу. Перед настоящим запуском SEED_DEMO не задавать.
 */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

if (process.env.SEED_DEMO !== "1") {
  console.log("[seed] SEED_DEMO не задан — пропускаем.");
  process.exit(0);
}

const file = process.env.DATABASE_PATH ?? "./data/bronx.db";
mkdirSync(dirname(file), { recursive: true });

const db = new DatabaseSync(file);
db.exec(`
CREATE TABLE IF NOT EXISTS class_sessions (
  id TEXT PRIMARY KEY,
  direction TEXT NOT NULL,
  audience TEXT,
  coach TEXT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 90,
  capacity INTEGER NOT NULL DEFAULT 12,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const count = db.prepare("SELECT COUNT(*) AS c FROM class_sessions").get().c;
if (count > 0) {
  console.log(`[seed] В базе уже ${count} занятий — ничего не добавляем.`);
  db.close();
  process.exit(0);
}

const day = (offset) =>
  new Date(Date.now() + offset * 86400000).toLocaleDateString("en-CA", {
    timeZone: "Asia/Krasnoyarsk",
  });

const sessions = [
  ["ММА", "Взрослые", day(1), "19:00", 90, 12],
  ["Бокс", "Дети", day(1), "17:00", 60, 10],
  ["БЖЖ / грэпплинг", "Взрослые", day(2), "20:00", 90, 14],
];

for (const [direction, audience, date, time, duration, capacity] of sessions) {
  db.prepare(
    "INSERT INTO class_sessions (id, direction, audience, date, start_time, duration_min, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(crypto.randomUUID(), direction, audience, date, time, duration, capacity);
}

console.log(`[seed] Добавлено занятий: ${sessions.length}`);
db.close();
