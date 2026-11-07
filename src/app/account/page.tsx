import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui";
import { club } from "@/content/club";
import {
  getCurrentUser,
  isDevLoginEnabled,
  isTelegramLoginConfigured,
} from "@/lib/auth";
import { listLeadsByUser, listMemberships, type User } from "@/lib/db";
import {
  formatSessionDate,
  getSession,
  listBookingsByUser,
} from "@/lib/schedule";

const bookingStatusLabels: Record<string, string> = {
  booked: "Место забронировано",
  cancelled: "Запись отменена",
  visited: "Занятие посещено",
  no_show: "Отмечена неявка",
};

export const metadata: Metadata = {
  title: "Личный кабинет",
  description: "Абонемент, заявки и история тренировок в клубе «Бронкс».",
  robots: { index: false, follow: false },
};

const errorMessages: Record<string, string> = {
  not_configured: "Вход через Telegram ещё не настроен. Используйте телефон или тестовый вход.",
  state_mismatch: "Ссылка входа устарела. Попробуйте войти заново.",
  token_error: "Telegram не подтвердил вход. Попробуйте ещё раз.",
  invalid_token: "Не удалось проверить ответ Telegram. Попробуйте ещё раз.",
  network_error: "Не получилось связаться с Telegram. Попробуйте позже.",
  missing_code: "Вход прервался. Попробуйте заново.",
};

function formatDate(value: string) {
  const parsed = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export default function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <main className="py-14 sm:py-20">
        <Container className="max-w-4xl">
          <p className="eyebrow">Личный кабинет</p>
          <h1 className="mt-4 heading-display text-3xl sm:text-4xl">
            Кабинет ученика
          </h1>

          <Suspense fallback={<AccountSkeleton />}>
            <AccountContent searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

function AccountSkeleton() {
  return (
    <div className="mt-8 space-y-4" aria-hidden>
      <div className="card h-40 animate-pulse" />
      <div className="card h-28 animate-pulse" />
    </div>
  );
}

async function AccountContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getCurrentUser();

  if (!user) return <LoginPanel error={error} />;
  return <AccountDashboard user={user} />;
}

function LoginPanel({ error }: { error?: string }) {
  const telegramReady = isTelegramLoginConfigured();
  const devReady = isDevLoginEnabled();
  const errorText = error
    ? (errorMessages[error] ?? "Не получилось войти. Попробуйте ещё раз.")
    : null;

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="card p-6">
        <p className="eyebrow">Вход</p>
        <h2 className="mt-3 heading-display text-2xl">Войти в кабинет</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Кабинет нужен, чтобы видеть свой абонемент, историю посещений и
          заявки. Вход — через Telegram, без пароля и SMS.
        </p>

        {errorText ? (
          <p
            role="alert"
            className="mt-4 border border-brand/50 bg-brand-ink/30 px-3 py-2 text-sm text-brand-hi"
          >
            {errorText}
          </p>
        ) : null}

        <div className="mt-6 space-y-3">
          {telegramReady ? (
            <a href="/api/auth/telegram/start" className="btn btn-primary w-full">
              Войти через Telegram
            </a>
          ) : (
            <div className="border border-dashed border-line p-4 text-sm text-muted">
              Вход через Telegram появится после регистрации бота и приложения
              Telegram Login. Пока можно воспользоваться телефоном.
            </div>
          )}

          {devReady ? (
            <form action="/api/auth/dev-login" method="post">
              <button type="submit" className="btn btn-ghost w-full">
                Тестовый вход (локально)
              </button>
            </form>
          ) : null}
        </div>

        <p className="mt-5 text-xs leading-relaxed text-muted/70">
          Вход через VK ID добавим отдельно: для него нужно зарегистрировать
          приложение ВКонтакте.
        </p>
      </div>

      <aside className="card flex flex-col justify-between gap-4 p-6">
        <div className="space-y-3">
          <p className="eyebrow">Пока без кабинета</p>
          <p className="text-sm leading-relaxed text-muted">
            Можно просто позвонить — администратор запишет на тренировку и
            расскажет про абонемент.
          </p>
        </div>
        <div className="space-y-2">
          <a href={`tel:${club.phone.tel}`} className="btn btn-ghost w-full">
            {club.phone.display}
          </a>
          <a
            href={club.links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost w-full"
          >
            Написать в WhatsApp
          </a>
          <Link
            href="/#lead"
            className="block pt-2 text-center text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-paper"
          >
            Оставить заявку на сайте
          </Link>
        </div>
      </aside>
    </div>
  );
}

async function AccountDashboard({ user }: { user: User }) {
  const memberships = listMemberships(user.id);
  const leads = listLeadsByUser(user.id);
  const bookings = listBookingsByUser(user.id);

  return (
    <div className="mt-8 space-y-4">
      <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted/70">
            Вы вошли как
          </p>
          <p className="mt-1 heading-display text-2xl">{user.name}</p>
          <p className="mt-1 text-xs text-muted">
            {user.role === "ADMIN"
              ? "Администратор клуба"
              : "Ученик клуба"}
            {user.phone ? ` · ${user.phone}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {user.role === "ADMIN" ? (
            <Link href="/admin" className="btn btn-primary">
              Админка
            </Link>
          ) : null}
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="btn btn-ghost">
              Выйти
            </button>
          </form>
        </div>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="card p-6">
          <p className="eyebrow">Абонемент</p>
          {memberships.length === 0 ? (
            <>
              <h2 className="mt-3 heading-display text-xl">
                Абонемент не оформлен
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Когда администратор оформит абонемент, здесь появятся его срок,
                остаток занятий и статус. Пока данных нет — это нормально для
                тестового кабинета.
              </p>
              <a
                href={`tel:${club.phone.tel}`}
                className="btn btn-ghost mt-4 w-full"
              >
                Уточнить абонемент
              </a>
            </>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {memberships.map((membership) => (
                <li key={membership.id} className="py-3">
                  <p className="text-sm font-medium text-paper">
                    {membership.title}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    с {formatDate(membership.startsAt)}
                    {membership.endsAt
                      ? ` по ${formatDate(membership.endsAt)}`
                      : ""}
                    {membership.sessionsLeft !== null
                      ? ` · осталось ${membership.sessionsLeft} занятий`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <p className="eyebrow">Мои заявки</p>
          {leads.length === 0 ? (
            <>
              <h2 className="mt-3 heading-display text-xl">Заявок пока нет</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Заявки, отправленные из формы на сайте под своим аккаунтом,
                будут сохраняться здесь, чтобы не теряться в переписке.
              </p>
              <Link href="/#lead" className="btn btn-ghost mt-4 w-full">
                Записаться на тренировку
              </Link>
            </>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {leads.map((lead) => (
                <li key={lead.id} className="py-3">
                  <p className="text-sm font-medium text-paper">
                    {lead.direction ?? "Направление не указано"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(lead.createdAt)} · {lead.phone}
                  </p>
                  {lead.comment ? (
                    <p className="mt-1 text-xs text-muted/80">{lead.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-6">
        <p className="eyebrow">Мои занятия</p>
        {bookings.length === 0 ? (
          <>
            <h2 className="mt-3 heading-display text-xl">Записей пока нет</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Здесь появятся занятия, на которые вы записались с сайта: время,
              направление и статус записи.
            </p>
            <Link href="/schedule" className="btn btn-ghost mt-4">
              Смотреть расписание
            </Link>
          </>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {bookings.map((booking) => {
              const session = getSession(booking.sessionId);
              return (
                <li
                  key={booking.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-paper">
                      {session
                        ? `${formatSessionDate(session.date)}, ${session.startTime} · ${session.direction}`
                        : "Занятие удалено"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {bookingStatusLabels[booking.status] ?? booking.status}
                    </p>
                  </div>
                  <Link
                    href={`/booking/${booking.cancelToken}`}
                    className="text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-paper"
                  >
                    Подробнее
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border border-dashed border-line p-5 text-sm leading-relaxed text-muted">
        <p className="text-paper">Что появится дальше</p>
        <p className="mt-2">
          История посещений и оплата абонемента онлайн. Эти разделы — следующие
          этапы; сейчас кабинет показывает то, что уже есть в базе.
        </p>
      </div>
    </div>
  );
}
