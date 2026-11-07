import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/ui";
import { directions } from "@/content/club";
import { requireAdmin } from "@/lib/auth";
import {
  clubNow,
  formatSessionDate,
  listAllSessions,
  listBookingsBySession,
  listLeads,
  listUsers,
} from "@/lib/schedule";
import {
  cancelSessionAction,
  createSessionAction,
  deleteSessionAction,
  markBookingAction,
  setRoleAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Админка",
  robots: { index: false, follow: false },
};

const inputClass =
  "h-10 w-full rounded-sm border border-line bg-ink px-3 text-sm text-paper placeholder:text-muted/50 focus:border-brand focus:outline-none";

const labelClass = "text-[0.65rem] uppercase tracking-[0.16em] text-muted/70";

const bookingStatusLabels: Record<string, string> = {
  booked: "записан",
  cancelled: "отменён",
  visited: "пришёл",
  no_show: "не пришёл",
};

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="py-12 sm:py-16">
        <Container>
          <Suspense fallback={<div className="card h-64 animate-pulse" />}>
            <AdminContent />
          </Suspense>
        </Container>
      </main>
    </>
  );
}

async function AdminContent() {
  await connection();
  const admin = await requireAdmin();
  const sessions = listAllSessions();
  const leads = listLeads();
  const users = listUsers();
  const now = clubNow();

  const key = (session: { date: string; startTime: string }) =>
    `${session.date} ${session.startTime}`;

  // Сначала ближайшие занятия (по возрастанию), затем прошедшие и отменённые.
  const upcoming = sessions
    .filter((session) => session.status === "active" && session.date >= now.date)
    .sort((a, b) => key(a).localeCompare(key(b)));
  const finished = sessions
    .filter((session) => !(session.status === "active" && session.date >= now.date))
    .sort((a, b) => key(b).localeCompare(key(a)));

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Админка</p>
          <h1 className="mt-3 heading-display text-3xl">Управление клубом</h1>
          <p className="mt-2 text-sm text-muted">
            {admin.name} · администратор
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/schedule" className="btn btn-ghost">
            Расписание
          </Link>
          <Link href="/account" className="btn btn-ghost">
            Кабинет
          </Link>
        </div>
      </header>

      <dl className="grid gap-px border border-line bg-line sm:grid-cols-3">
        {[
          { label: "Активных занятий", value: upcoming.length },
          { label: "Заявок с сайта", value: leads.length },
          { label: "Учеников в базе", value: users.length },
        ].map((item) => (
          <div key={item.label} className="bg-ink p-5">
            <dt className={labelClass}>{item.label}</dt>
            <dd className="mt-1 heading-display text-3xl">{item.value}</dd>
          </div>
        ))}
      </dl>

      {/* Новое занятие */}
      <section id="create-session" className="scroll-mt-24">
        <h2 className="heading-display text-2xl">Добавить занятие</h2>
        <p className="mt-2 text-sm text-muted">
          Дата и время — по часам клуба (Абакан, UTC+7). Сейчас там{" "}
          {formatSessionDate(now.date)}, {now.time}.
        </p>

        <form
          action={createSessionAction}
          className="mt-4 grid gap-3 border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="space-y-1.5">
            <span className={labelClass}>Направление</span>
            <input
              name="direction"
              list="admin-directions"
              required
              placeholder="ММА"
              className={inputClass}
            />
            <datalist id="admin-directions">
              {directions.map((direction) => (
                <option key={direction.slug} value={direction.title} />
              ))}
            </datalist>
          </label>

          <label className="space-y-1.5">
            <span className={labelClass}>Кому</span>
            <input
              name="audience"
              placeholder="Взрослые"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className={labelClass}>Тренер</span>
            <input name="coach" placeholder="Имя" className={inputClass} />
          </label>

          <label className="space-y-1.5">
            <span className={labelClass}>Дата</span>
            <input
              name="date"
              type="date"
              required
              defaultValue={now.date}
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className={labelClass}>Начало</span>
            <input
              name="time"
              type="time"
              required
              defaultValue="19:00"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className={labelClass}>Длительность, мин</span>
            <input
              name="duration"
              type="number"
              min={15}
              max={240}
              defaultValue={90}
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className={labelClass}>Мест в группе</span>
            <input
              name="capacity"
              type="number"
              min={1}
              max={100}
              defaultValue={12}
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className={labelClass}>Заметка</span>
            <input
              name="note"
              placeholder="Например: новички"
              className={inputClass}
            />
          </label>

          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn btn-primary">
              Добавить занятие
            </button>
          </div>
        </form>
      </section>

      {/* Занятия */}
      <section id="sessions" className="scroll-mt-24">
        <h2 className="heading-display text-2xl">Занятия и записи</h2>
        <p className="mt-2 text-sm text-muted">
          Ближайших занятий: {upcoming.length}, всего в базе: {sessions.length}. В
          каждом блоке — список записавшихся с отметками посещения.
        </p>

        {sessions.length === 0 ? (
          <p className="mt-4 border border-dashed border-line p-5 text-sm text-muted">
            Пока ни одного занятия. Добавьте первое — оно сразу появится на
            странице расписания.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {[...upcoming, ...finished].map((session, index) => {
              const bookings = listBookingsBySession(session.id);
              const activeBookings = bookings.filter(
                (booking) =>
                  booking.status === "booked" || booking.status === "visited",
              );
              const isUpcoming = session.date >= now.date;

              return (
                <Fragment key={session.id}>
                  {index === upcoming.length && finished.length > 0 ? (
                    <li className="pt-6 text-[0.65rem] uppercase tracking-[0.2em] text-muted/60">
                      Прошедшие и отменённые
                    </li>
                  ) : null}
                  <li className="border border-line bg-surface">
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="heading-display text-lg">
                          {formatSessionDate(session.date)}, {session.startTime}
                        </span>
                        <span className="text-sm text-paper/90">
                          {session.direction}
                        </span>
                        {session.audience ? (
                          <span className="text-[0.65rem] uppercase tracking-[0.16em] text-muted/70">
                            {session.audience}
                          </span>
                        ) : null}
                        {session.status === "cancelled" ? (
                          <span className="rounded-full border border-brand/50 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-brand-hi">
                            отменено
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {activeBookings.length} из {session.capacity} мест
                        {session.coach ? ` · тренер: ${session.coach}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {session.status === "active" && isUpcoming ? (
                        <form action={cancelSessionAction}>
                          <input
                            type="hidden"
                            name="sessionId"
                            value={session.id}
                          />
                          <button
                            type="submit"
                            className="btn btn-ghost px-3 py-2 text-[0.7rem]"
                          >
                            Отменить занятие
                          </button>
                        </form>
                      ) : null}
                      <form action={deleteSessionAction}>
                        <input type="hidden" name="sessionId" value={session.id} />
                        <button
                          type="submit"
                          className="btn btn-ghost px-3 py-2 text-[0.7rem]"
                          title="Удаляет занятие и все записи на него"
                        >
                          Удалить с записями
                        </button>
                      </form>
                    </div>
                  </div>

                  {bookings.length > 0 ? (
                    <details className="border-t border-line/70 px-4 py-3">
                      <summary className="cursor-pointer text-xs uppercase tracking-[0.16em] text-muted">
                        Записи: {activeBookings.length} активных из{" "}
                        {bookings.length}
                      </summary>
                      <ul className="mt-3 space-y-2">
                        {bookings.map((booking) => (
                          <li
                            key={booking.id}
                            className="flex flex-col gap-2 border border-line/60 bg-ink px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="text-sm">
                              <span className="text-paper">{booking.name}</span>
                              <span className="text-muted"> · {booking.phone}</span>
                              <span className="ml-2 text-[0.65rem] uppercase tracking-[0.12em] text-muted/70">
                                {bookingStatusLabels[booking.status] ??
                                  booking.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {(
                                [
                                  ["visited", "Пришёл"],
                                  ["no_show", "Неявка"],
                                  ["cancelled", "Отменить"],
                                ] as const
                              ).map(([status, label]) => (
                                <form key={status} action={markBookingAction}>
                                  <input
                                    type="hidden"
                                    name="bookingId"
                                    value={booking.id}
                                  />
                                  <input type="hidden" name="status" value={status} />
                                  <button
                                    type="submit"
                                    className="rounded-sm border border-line px-2 py-1 text-[0.65rem] uppercase tracking-[0.1em] text-muted transition-colors hover:border-brand/60 hover:text-paper"
                                  >
                                    {label}
                                  </button>
                                </form>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <p className="border-t border-line/70 px-4 py-3 text-xs text-muted/70">
                      Записей пока нет.
                    </p>
                  )}
                </li>
                </Fragment>
              );
            })}
          </ul>
        )}
      </section>

      {/* Заявки */}
      <section id="leads" className="scroll-mt-24">
        <h2 className="heading-display text-2xl">Заявки с сайта</h2>
        {leads.length === 0 ? (
          <p className="mt-4 border border-dashed border-line p-5 text-sm text-muted">
            Заявок пока нет.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto border border-line">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-surface text-[0.65rem] uppercase tracking-[0.16em] text-muted/70">
                  <th className="px-3 py-2 font-medium">Дата</th>
                  <th className="px-3 py-2 font-medium">Имя</th>
                  <th className="px-3 py-2 font-medium">Телефон</th>
                  <th className="px-3 py-2 font-medium">Направление</th>
                  <th className="px-3 py-2 font-medium">Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-line/70">
                    <td className="whitespace-nowrap px-3 py-2 text-muted">
                      {lead.createdAt.slice(0, 16)}
                    </td>
                    <td className="px-3 py-2 text-paper">{lead.name}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted">
                      {lead.phone}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {lead.direction ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted/80">
                      {lead.comment ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ученики */}
      <section id="students" className="scroll-mt-24">
        <h2 className="heading-display text-2xl">Ученики</h2>
        <p className="mt-2 text-sm text-muted">
          Роль «администратор» открывает доступ к этой странице. Свою роль снять
          нельзя.
        </p>

        <div className="mt-4 overflow-x-auto border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-surface text-[0.65rem] uppercase tracking-[0.16em] text-muted/70">
                <th className="px-3 py-2 font-medium">Имя</th>
                <th className="px-3 py-2 font-medium">Telegram</th>
                <th className="px-3 py-2 font-medium">Телефон</th>
                <th className="px-3 py-2 font-medium">Роль</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-line/70">
                  <td className="px-3 py-2 text-paper">{user.name}</td>
                  <td className="px-3 py-2 text-muted">
                    {user.telegramId === "dev-local"
                      ? "тестовый вход"
                      : (user.telegramId ?? "—")}
                  </td>
                  <td className="px-3 py-2 text-muted">{user.phone ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        user.role === "ADMIN"
                          ? "text-[0.65rem] uppercase tracking-[0.12em] text-brand-hi"
                          : "text-[0.65rem] uppercase tracking-[0.12em] text-muted"
                      }
                    >
                      {user.role === "ADMIN" ? "администратор" : "ученик"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {user.id === admin.id ? null : (
                      <form action={setRoleAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input
                          type="hidden"
                          name="role"
                          value={user.role === "ADMIN" ? "STUDENT" : "ADMIN"}
                        />
                        <button
                          type="submit"
                          className="rounded-sm border border-line px-2 py-1 text-[0.65rem] uppercase tracking-[0.1em] text-muted transition-colors hover:border-brand/60 hover:text-paper"
                        >
                          {user.role === "ADMIN" ? "Сделать учеником" : "Сделать админом"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
