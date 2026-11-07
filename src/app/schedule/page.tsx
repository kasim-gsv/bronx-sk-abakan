import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui";
import { club } from "@/content/club";
import { formatSessionDate, listUpcomingSessions } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Расписание и запись",
  description:
    "Ближайшие занятия клуба «Бронкс»: направления, время, свободные места и запись онлайн.",
};

export default function SchedulePage() {
  return (
    <>
      <SiteHeader />
      <main className="py-14 sm:py-20">
        <Container className="max-w-4xl">
          <p className="eyebrow">Расписание</p>
          <h1 className="mt-4 heading-display text-3xl sm:text-4xl">
            Ближайшие занятия
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Запись занимает место в группе. Если планы изменились — отмените
            запись по ссылке из подтверждения, чтобы место досталось другому.
          </p>

          <Suspense fallback={<ScheduleSkeleton />}>
            <SessionList />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="mt-8 space-y-3" aria-hidden>
      <div className="card h-24 animate-pulse" />
      <div className="card h-24 animate-pulse" />
      <div className="card h-24 animate-pulse" />
    </div>
  );
}

async function SessionList() {
  await connection();
  const sessions = listUpcomingSessions();

  if (sessions.length === 0) {
    return (
      <div className="mt-8 border border-dashed border-line p-6 sm:p-8">
        <p className="heading-display text-xl">Занятия ещё не опубликованы</p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Администратор пока не завёл расписание в системе — это делается в
          админке. Как только занятия появятся, здесь будет запись с
          ограничением по местам. Пока можно позвонить или оставить заявку.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <a href={`tel:${club.phone.tel}`} className="btn btn-primary">
            {club.phone.display}
          </a>
          <Link href="/#lead" className="btn btn-ghost">
            Оставить заявку
          </Link>
        </div>
      </div>
    );
  }

  const groups = sessions.reduce<Record<string, typeof sessions>>(
    (acc, session) => {
      (acc[session.date] ??= []).push(session);
      return acc;
    },
    {},
  );

  return (
    <div className="mt-8 space-y-8">
      {Object.entries(groups).map(([date, daySessions]) => (
        <section key={date} aria-labelledby={`date-${date}`}>
          <h2
            id={`date-${date}`}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-muted/70"
          >
            {formatSessionDate(date)}
          </h2>

          <ul className="mt-3 space-y-3">
            {daySessions.map((session) => {
              const full = session.seatsLeft === 0;
              return (
                <li
                  key={session.id}
                  className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="heading-display text-xl">
                        {session.startTime}
                      </span>
                      <span className="heading-display text-lg text-paper/90">
                        {session.direction}
                      </span>
                      {session.audience ? (
                        <span className="text-xs uppercase tracking-[0.16em] text-muted/70">
                          {session.audience}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {session.coach ? `Тренер: ${session.coach} · ` : ""}
                      {session.durationMin} мин ·{" "}
                      {full
                        ? "мест нет"
                        : `свободно ${session.seatsLeft} из ${session.capacity}`}
                    </p>
                    {session.note ? (
                      <p className="mt-1 text-xs text-muted/80">{session.note}</p>
                    ) : null}
                  </div>

                  {full ? (
                    <span className="btn btn-ghost cursor-not-allowed opacity-60">
                      Мест нет
                    </span>
                  ) : (
                    <Link
                      href={`/book/${session.id}`}
                      className="btn btn-primary shrink-0"
                    >
                      Записаться
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
