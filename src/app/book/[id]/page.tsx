import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui";
import { BookingForm } from "@/components/booking-form";
import { formatSessionDate, getSession } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Запись на занятие",
  description: "Запись на занятие клуба «Бронкс».",
  robots: { index: false, follow: true },
};

export default function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <main className="py-14 sm:py-20">
        <Container className="max-w-3xl">
          <Link
            href="/schedule"
            className="text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-paper"
          >
            ← К расписанию
          </Link>
          <Suspense fallback={<div className="card mt-6 h-64 animate-pulse" />}>
            <BookContent params={params} />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

async function BookContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const session = getSession(id);

  if (!session || session.status !== "active") {
    return (
      <div className="mt-6 border border-dashed border-line p-6">
        <h1 className="heading-display text-2xl">Занятие не найдено</h1>
        <p className="mt-3 text-sm text-muted">
          Возможно, занятие отменили или ссылка устарела. Посмотрите актуальное
          расписание.
        </p>
        <Link href="/schedule" className="btn btn-ghost mt-5">
          Открыть расписание
        </Link>
      </div>
    );
  }

  const full = session.seatsLeft === 0;

  return (
    <>
      <h1 className="mt-6 heading-display text-3xl sm:text-4xl">
        Запись на занятие
      </h1>

      <div className="card mt-6 p-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="heading-display text-2xl">{session.startTime}</span>
          <span className="heading-display text-xl text-paper/90">
            {session.direction}
          </span>
          {session.audience ? (
            <span className="text-xs uppercase tracking-[0.16em] text-muted/70">
              {session.audience}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted">
          {formatSessionDate(session.date)} · {session.durationMin} мин
          {session.coach ? ` · тренер: ${session.coach}` : ""}
        </p>
        <p className="mt-2 text-sm text-muted">
          {full
            ? "Свободных мест не осталось."
            : `Свободно ${session.seatsLeft} из ${session.capacity} мест.`}
        </p>
        {session.note ? (
          <p className="mt-2 text-xs text-muted/80">{session.note}</p>
        ) : null}
      </div>

      {full ? (
        <div className="mt-4 border border-dashed border-line p-6 text-sm text-muted">
          Мест нет — попробуйте другое время или напишите администратору, чтобы
          вас добавили в группу при освобождении места.
        </div>
      ) : (
        <div className="card mt-4 p-6">
          <BookingForm sessionId={session.id} />
        </div>
      )}
    </>
  );
}
