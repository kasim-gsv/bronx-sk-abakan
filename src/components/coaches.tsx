import { club, coaches } from "@/content/club";
import { Container, MediaPlaceholder, SectionHeading } from "@/components/ui";

export function Coaches() {
  return (
    <section id="coaches" className="border-b border-line py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Тренеры"
          title="Тренерский состав"
          text="Групповые занятия ведут тренеры по направлениям. Имена, регалии и фотографии клуб ещё не прислал — карточки заполним сразу после получения данных."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {coaches.map((coach, index) => (
            <article key={coach.id} className="card overflow-hidden">
              <MediaPlaceholder
                label="Фото тренера"
                className="aspect-[4/3] border-0 border-b border-line sm:aspect-[4/5]"
              />
              <div className="space-y-2 p-5">
                <p className="text-[0.66rem] uppercase tracking-[0.2em] text-muted/60">
                  Тренер {index + 1}
                </p>
                <h3 className="heading-display text-lg">{coach.direction}</h3>
                <p className="text-sm text-muted">
                  Имя и спортивные достижения — уточняются.
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 border border-dashed border-line p-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Пришлите имена, направления и регалии тренеров — блок сразу
            заполнится, и его можно будет обновлять без правки вёрстки.
          </p>
          <a
            href={club.links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost shrink-0"
          >
            Отправить данные
          </a>
        </div>
      </Container>
    </section>
  );
}
