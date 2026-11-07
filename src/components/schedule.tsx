import Link from "next/link";
import { club, schedule } from "@/content/club";
import { Container, SectionHeading } from "@/components/ui";

export function Schedule() {
  return (
    <section id="schedule" className="border-b border-line bg-ink-2 py-16 sm:py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <SectionHeading
              eyebrow="Расписание"
              title="Группы и время"
              text="Точные часы занятий клуб пока не подтвердил, поэтому в таблице стоит «уточняется» — вместо выдуманного расписания. После получения данных время появится здесь."
            />

            <div className="mt-8 overflow-hidden border border-line">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">
                  Направления клуба и время занятий
                </caption>
                <thead>
                  <tr className="bg-surface text-[0.66rem] uppercase tracking-[0.18em] text-muted/70">
                    <th scope="col" className="px-4 py-3 font-medium">
                      Направление
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Кому
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Время
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr
                      key={`${row.direction}-${row.audience}`}
                      className="border-t border-line/80 transition-colors hover:bg-surface/60"
                    >
                      <th
                        scope="row"
                        className="px-4 py-3.5 text-left font-medium text-paper"
                      >
                        {row.direction}
                      </th>
                      <td className="px-4 py-3.5 text-muted">{row.audience}</td>
                      <td className="px-4 py-3.5 italic text-muted/70">
                        {row.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="flex flex-col justify-between gap-6 border border-line bg-surface p-6">
            <div className="space-y-3">
              <p className="eyebrow">Как узнать точно</p>
              <p className="heading-display text-2xl">
                Позвоните или напишите
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Администратор подскажет, какая группа подходит по возрасту и
                уровню, и назовёт точное время.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/schedule" className="btn btn-primary w-full">
                Расписание и запись
              </Link>
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
              <p className="text-xs leading-relaxed text-muted/70">
                Клуб работает Пн–Сб с 09:00 до 22:00, воскресенье — выходной.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
