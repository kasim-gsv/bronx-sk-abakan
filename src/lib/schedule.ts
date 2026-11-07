import { getDb } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

/** Клуб живёт в Абакане: UTC+7, без перехода на летнее время. */
export const CLUB_TIME_ZONE = "Asia/Krasnoyarsk";

export type SessionStatus = "active" | "cancelled";
export type BookingStatus = "booked" | "cancelled" | "visited" | "no_show";

export type Session = {
  id: string;
  direction: string;
  audience: string | null;
  coach: string | null;
  date: string;
  startTime: string;
  durationMin: number;
  capacity: number;
  note: string | null;
  status: SessionStatus;
  bookedCount: number;
  seatsLeft: number;
};

export type Booking = {
  id: string;
  sessionId: string;
  userId: string | null;
  name: string;
  phone: string;
  status: BookingStatus;
  cancelToken: string;
  createdAt: string;
};

export type SessionWithBookings = Session & { bookings: Booking[] };

type SessionRow = {
  id: string;
  direction: string;
  audience: string | null;
  coach: string | null;
  date: string;
  start_time: string;
  duration_min: number;
  capacity: number;
  note: string | null;
  status: SessionStatus;
  booked_count: number;
};

type BookingRow = {
  id: string;
  session_id: string;
  user_id: string | null;
  name: string;
  phone: string;
  status: BookingStatus;
  cancel_token: string;
  created_at: string;
};

/** Текущие дата и время по часам клуба, независимо от часового пояса сервера. */
export function clubNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  // Некоторые сборки ICU отдают полночь как «24» — приводим к «00»,
  // иначе сравнение времени занятия ломается около полуночи.
  const hour = get("hour") === "24" ? "00" : get("hour");

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
  };
}

export function formatSessionDate(date: string) {
  const parsed = new Date(`${date}T00:00:00+07:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: CLUB_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "long",
  }).format(parsed);
}

function mapSession(row: SessionRow): Session {
  const bookedCount = Number(row.booked_count ?? 0);
  return {
    id: row.id,
    direction: row.direction,
    audience: row.audience,
    coach: row.coach,
    date: row.date,
    startTime: row.start_time,
    durationMin: Number(row.duration_min),
    capacity: Number(row.capacity),
    note: row.note,
    status: row.status,
    bookedCount,
    seatsLeft: Math.max(0, Number(row.capacity) - bookedCount),
  };
}

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    status: row.status,
    cancelToken: row.cancel_token,
    createdAt: row.created_at,
  };
}

const SESSION_SELECT = `
  SELECT s.id, s.direction, s.audience, s.coach, s.date, s.start_time,
         s.duration_min, s.capacity, s.note, s.status,
         (SELECT COUNT(*) FROM bookings b
           WHERE b.session_id = s.id AND b.status IN ('booked', 'visited')) AS booked_count
  FROM class_sessions s
`;

export function createSession(input: {
  direction: string;
  audience?: string;
  coach?: string;
  date: string;
  startTime: string;
  durationMin?: number;
  capacity?: number;
  note?: string;
}): Session {
  const db = getDb();
  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO class_sessions
      (id, direction, audience, coach, date, start_time, duration_min, capacity, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.direction,
    input.audience ?? null,
    input.coach ?? null,
    input.date,
    input.startTime,
    input.durationMin ?? 90,
    input.capacity ?? 12,
    input.note ?? null,
  );

  return getSession(id)!;
}

export function getSession(id: string): Session | null {
  const row = getDb()
    .prepare(`${SESSION_SELECT} WHERE s.id = ?`)
    .get(id) as SessionRow | undefined;
  return row ? mapSession(row) : null;
}

/** Ближайшие занятия для страницы расписания. */
export function listUpcomingSessions(limit = 50): Session[] {
  const { date, time } = clubNow();
  const rows = getDb()
    .prepare(
      `${SESSION_SELECT}
       WHERE s.status = 'active'
         AND (s.date > ? OR (s.date = ? AND s.start_time >= ?))
       ORDER BY s.date, s.start_time
       LIMIT ?`,
    )
    .all(date, date, time, limit) as SessionRow[];
  return rows.map(mapSession);
}

/** Все занятия для админки (включая прошедшие и отменённые). */
export function listAllSessions(limit = 200): Session[] {
  const rows = getDb()
    .prepare(`${SESSION_SELECT} ORDER BY s.date DESC, s.start_time DESC LIMIT ?`)
    .all(limit) as SessionRow[];
  return rows.map(mapSession);
}

export function cancelSession(id: string) {
  getDb()
    .prepare("UPDATE class_sessions SET status = 'cancelled' WHERE id = ?")
    .run(id);
}

export function deleteSession(id: string) {
  getDb().prepare("DELETE FROM class_sessions WHERE id = ?").run(id);
}

export class BookingError extends Error {
  code: "full" | "closed" | "past" | "duplicate" | "invalid";
  constructor(code: BookingError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Запись на занятие. Проверка свободных мест и вставка идут в одной
 * транзакции, чтобы два одновременных запроса не заняли одно место.
 */
export function createBooking(input: {
  sessionId: string;
  name: string;
  phone: string;
  userId?: string | null;
}): Booking {
  const normalized = normalizePhone(input.phone);
  if (!normalized) {
    throw new BookingError("invalid", "Проверьте номер телефона.");
  }

  const db = getDb();
  db.exec("BEGIN IMMEDIATE");

  let createdId: string;

  try {
    const session = getSession(input.sessionId);
    if (!session) throw new BookingError("closed", "Занятие не найдено.");
    if (session.status !== "active") {
      throw new BookingError("closed", "Занятие отменено.");
    }

    const now = clubNow();
    if (
      session.date < now.date ||
      (session.date === now.date && session.startTime <= now.time)
    ) {
      throw new BookingError("past", "Это занятие уже началось.");
    }

    const bookedCount = Number(
      (
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM bookings WHERE session_id = ? AND status IN ('booked', 'visited')",
          )
          .get(session.id) as { count: number }
      ).count,
    );

    if (bookedCount >= session.capacity) {
      throw new BookingError("full", "Свободных мест не осталось.");
    }

    // Сравниваем по цифрам: старые записи могли сохранить номер в другом
    // формате, и простое сравнение строк пропускало дубли.
    const existingPhones = db
      .prepare(
        "SELECT phone FROM bookings WHERE session_id = ? AND status IN ('booked', 'visited')",
      )
      .all(session.id) as Array<{ phone: string }>;

    const duplicate = existingPhones.some(
      (row) => normalizePhone(row.phone)?.digits === normalized.digits,
    );

    if (duplicate) {
      throw new BookingError(
        "duplicate",
        "На это занятие этот номер уже записан.",
      );
    }

    createdId = crypto.randomUUID();
    const cancelToken = crypto.randomUUID().replaceAll("-", "");

    db.prepare(
      `INSERT INTO bookings (id, session_id, user_id, name, phone, cancel_token)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      createdId,
      session.id,
      input.userId ?? null,
      input.name,
      normalized.value,
      cancelToken,
    );

    db.exec("COMMIT");
  } catch (error) {
    // Если COMMIT уже прошёл, ROLLBACK бросит ошибку — не даём ей
    // замаскировать исходную причину.
    try {
      db.exec("ROLLBACK");
    } catch {
      // транзакция уже закрыта
    }
    throw error;
  }

  const booking = getBookingById(createdId);
  if (!booking) {
    throw new Error("Запись создана, но не найдена в базе.");
  }
  return booking;
}

function getBookingById(id: string): Booking | null {
  const row = getDb()
    .prepare(
      "SELECT id, session_id, user_id, name, phone, status, cancel_token, created_at FROM bookings WHERE id = ?",
    )
    .get(id) as BookingRow | undefined;
  return row ? mapBooking(row) : null;
}

export function getBookingByToken(token: string): Booking | null {
  const row = getDb()
    .prepare(
      "SELECT id, session_id, user_id, name, phone, status, cancel_token, created_at FROM bookings WHERE cancel_token = ?",
    )
    .get(token) as BookingRow | undefined;
  return row ? mapBooking(row) : null;
}

export function cancelBookingByToken(token: string): boolean {
  const result = getDb()
    .prepare(
      "UPDATE bookings SET status = 'cancelled' WHERE cancel_token = ? AND status = 'booked'",
    )
    .run(token);
  return Number(result.changes) > 0;
}

export function listBookingsBySession(sessionId: string): Booking[] {
  const rows = getDb()
    .prepare(
      "SELECT id, session_id, user_id, name, phone, status, cancel_token, created_at FROM bookings WHERE session_id = ? ORDER BY created_at",
    )
    .all(sessionId) as BookingRow[];
  return rows.map(mapBooking);
}

export function listBookingsByUser(userId: string): Booking[] {
  const rows = getDb()
    .prepare(
      "SELECT id, session_id, user_id, name, phone, status, cancel_token, created_at FROM bookings WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
    )
    .all(userId) as BookingRow[];
  return rows.map(mapBooking);
}

export function updateBookingStatus(id: string, status: BookingStatus) {
  getDb().prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);
}

export function getSessionWithBookings(id: string): SessionWithBookings | null {
  const session = getSession(id);
  if (!session) return null;
  return { ...session, bookings: listBookingsBySession(id) };
}

export function listUsers() {
  const rows = getDb()
    .prepare(
      "SELECT id, name, telegram_id, phone, role, created_at FROM users ORDER BY created_at DESC LIMIT 200",
    )
    .all() as Array<{
    id: string;
    name: string;
    telegram_id: string | null;
    phone: string | null;
    role: "STUDENT" | "ADMIN";
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    telegramId: row.telegram_id,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at,
  }));
}

export function setUserRole(id: string, role: "STUDENT" | "ADMIN") {
  getDb().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
}

export function listLeads(limit = 100) {
  const rows = getDb()
    .prepare(
      `SELECT id, user_id, name, phone, direction, comment, created_at
       FROM leads ORDER BY created_at DESC LIMIT ?`,
    )
    .all(limit) as Array<{
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
