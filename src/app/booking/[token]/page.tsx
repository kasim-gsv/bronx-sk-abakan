import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui";
import { club } from "@/content/club";
import { formatSessionDate, getBookingByToken, getSession } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Моя запись",
  robots: { index: false, follow: false },
};

const statusLabels: Record<string, string> = {
  booked: "Место забронировано",
  cancelled: "Запись отменена",
  visited: "Занятие посещено",
  no_show: "Отмечена неявка",
};

export default function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <main className="py-14 sm:py-20">
        <Container className="max-w-2xl">
          <Link
            href="/schedule"
            className="text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-paper"
          >
            ← К расписанию
          </Link>
          <Suspense fallback={<div className="card mt-6 h-64 animate-pulse" />}>
            <BookingContent params={params} searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

async function BookingContent({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  await connection();
  const { token } = await params;
  const { cancelled } = await searchParams;
  const booking = getBookingByToken(token);

  if (!booking) notFound();

  const session = getSession(booking.sessionId);
  const wasCancelled = cancelled === "1" && booking.status === "cancelled";

  return (
    <>
      <h1 className="mt-6 heading-display text-3xl sm:text-4xl">Моя запись</h1>

      <div className="card mt-6 space-y-3 p-6">
        <p className="eyebrow">{statusLabels[booking.status] ?? booking.status}</p>

        {session ? (
          <>
            <p className="heading-display text-2xl">
              {session.startTime} · {session.direction}
            </p>
            <p className="text-sm text-muted">
              {formatSessionDate(session.date)} · {session.durationMin} мин
              {session.coach ? ` · тренер: ${session.coach}` : ""}
            </p>
            <p className="text-sm text-muted">
              {club.venues[0].address}, {club.venues[0].details}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">Занятие больше не существует.</p>
        )}

        <p className="text-sm text-muted">
          Записан(а): {booking.name} · {booking.phone}
        </p>
      </div>

      {wasCancelled ? (
        <p
          role="status"
          className="mt-4 border border-line bg-surface px-4 py-3 text-sm text-muted"
        >
          Запись отменена, место освобождено.
        </p>
      ) : null}

      {booking.status === "booked" ? (
        <form
          action="/api/bookings/cancel"
          method="post"
          className="mt-4 flex flex-col gap-3"
        >
          <input type="hidden" name="token" value={booking.cancelToken} />
          <button type="submit" className="btn btn-ghost">
            Отменить запись
          </button>
          <p className="text-xs leading-relaxed text-muted/70">
            Сохраните эту страницу: по ней можно отменить запись без входа на
            сайт.
          </p>
        </form>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link href="/schedule" className="btn btn-ghost">
          Другое занятие
        </Link>
        <a href={`tel:${club.phone.tel}`} className="btn btn-ghost">
          {club.phone.display}
        </a>
      </div>
    </>
  );
}
