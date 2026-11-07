import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Локальная база на встроенном `node:sqlite` (Node 22.5+).
 * На этапе «каркаса» этого достаточно: нет движков, кодогенерации и внешних
 * сервисов. При переезде на хостинг меняется только этот файл — на Postgres.
 */

export type UserRole = "STUDENT" | "ADMIN";

export type User = {
  id: string;
  name: string;
  telegramId: string | null;
  phone: string | null;
  role: UserRole;
};

export type Membership = {
  id: string;
  userId: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  sessionsTotal: number | null;
  sessionsLeft: number | null;
  status: "active" | "expired" | "paused";
};

export type Lead = {
  id: string;
  userId: string | null;
  name: string;
  phone: string;
  direction: string | null;
  comment: string | null;
  createdAt: string;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  telegram_id TEXT UNIQUE,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'STUDENT',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memberships (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  starts_at      TEXT NOT NULL,
  ends_at        TEXT,
  sessions_total INTEGER,
  sessions_left  INTEGER,
  status         TEXT NOT NULL DEFAULT 'active',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  direction  TEXT,
  comment    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);

CREATE TABLE IF NOT EXISTS class_sessions (
  id           TEXT PRIMARY KEY,
  direction    TEXT NOT NULL,
  audience     TEXT,
  coach        TEXT,
  date         TEXT NOT NULL,          -- YYYY-MM-DD (время клуба, UTC+7)
  start_time   TEXT NOT NULL,          -- HH:MM
  duration_min INTEGER NOT NULL DEFAULT 90,
  capacity     INTEGER NOT NULL DEFAULT 12,
  note         TEXT,
  status       TEXT NOT NULL DEFAULT 'active',  -- active | cancelled
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id           TEXT PRIMARY KEY,
  session_id   TEXT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  user_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'booked',  -- booked | cancelled | visited | no_show
  cancel_token TEXT NOT NULL UNIQUE,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON class_sessions(date, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
`;

const globalForDb = globalThis as unknown as {
  __bronxDb?: DatabaseSync;
};

function openDatabase() {
  const file = process.env.DATABASE_PATH ?? join(process.cwd(), "data", "bronx.db");
  mkdirSync(dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  return db;
}

export function getDb() {
  if (!globalForDb.__bronxDb) {
    globalForDb.__bronxDb = openDatabase();
  }
  return globalForDb.__bronxDb;
}

type UserRow = {
  id: string;
  name: string;
  telegram_id: string | null;
  phone: string | null;
  role: UserRole;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    telegramId: row.telegram_id,
    phone: row.phone,
    role: row.role,
  };
}

export function getUserById(id: string): User | null {
  const row = getDb()
    .prepare("SELECT id, name, telegram_id, phone, role FROM users WHERE id = ?")
    .get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

/**
 * Находит пользователя по Telegram ID или создаёт нового.
 * Имя и телефон обновляются при каждом входе — они приходят из Telegram.
 */
export function upsertTelegramUser(input: {
  telegramId: string;
  name: string;
  phone?: string | null;
}): User {
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT id, name, telegram_id, phone, role FROM users WHERE telegram_id = ?",
    )
    .get(input.telegramId) as UserRow | undefined;

  if (existing) {
    db.prepare(
      "UPDATE users SET name = ?, phone = COALESCE(?, phone) WHERE id = ?",
    ).run(input.name, input.phone ?? null, existing.id);
    return getUserById(existing.id)!;
  }

  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO users (id, name, telegram_id, phone) VALUES (?, ?, ?, ?)",
  ).run(id, input.name, input.telegramId, input.phone ?? null);

  return getUserById(id)!;
}

/** Служебный пользователь для локальной проверки входа без Telegram. */
export function getOrCreateDevUser(): User {
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT id, name, telegram_id, phone, role FROM users WHERE telegram_id = ?",
    )
    .get("dev-local") as UserRow | undefined;

  if (existing) return mapUser(existing);

  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO users (id, name, telegram_id, role) VALUES (?, ?, ?, 'ADMIN')",
  ).run(id, "Тестовый ученик", "dev-local");

  return getUserById(id)!;
}

export function listMemberships(userId: string): Membership[] {
  const rows = getDb()
    .prepare(
      `SELECT id, user_id, title, starts_at, ends_at, sessions_total, sessions_left, status
       FROM memberships WHERE user_id = ? ORDER BY starts_at DESC`,
    )
    .all(userId) as Array<{
    id: string;
    user_id: string;
    title: string;
    starts_at: string;
    ends_at: string | null;
    sessions_total: number | null;
    sessions_left: number | null;
    status: Membership["status"];
  }>;

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    sessionsTotal: row.sessions_total,
    sessionsLeft: row.sessions_left,
    status: row.status,
  }));
}

export function saveLead(input: {
  userId?: string | null;
  name: string;
  phone: string;
  direction: string;
  comment: string;
}): Lead {
  const db = getDb();
  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO leads (id, user_id, name, phone, direction, comment)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.userId ?? null,
    input.name,
    input.phone,
    input.direction,
    input.comment || null,
  );

  const row = db
    .prepare(
      "SELECT id, user_id, name, phone, direction, comment, created_at FROM leads WHERE id = ?",
    )
    .get(id) as {
    id: string;
    user_id: string | null;
    name: string;
    phone: string;
    direction: string | null;
    comment: string | null;
    created_at: string;
  };

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    direction: row.direction,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

export function listLeadsByUser(userId: string): Lead[] {
  const rows = getDb()
    .prepare(
      `SELECT id, user_id, name, phone, direction, comment, created_at
       FROM leads WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
    )
    .all(userId) as Array<{
    id: string;
    user_id: string | null;
    name: string;
    phone: string;
    direction: string | null;
    comment: string | null;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    direction: row.direction,
    comment: row.comment,
    createdAt: row.created_at,
  }));
}
