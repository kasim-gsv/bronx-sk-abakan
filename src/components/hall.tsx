import { club } from "@/content/club";
import { Container, MediaPlaceholder, SectionHeading } from "@/components/ui";

const amenities = [
  "Зал бокса",
  "Тренажёрный зал",
  "Ринг и работа на снарядах",
  "Сауна",
  "Парковка",
  "Велопарковка",
  "Подарочные сертификаты",
  "Участие в соревнованиях",
];

export function Hall() {
  return (
    <section className="border-b border-line bg-ink-2 py-16 sm:py-24">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Зал"
            title="Где проходят тренировки"
            text="Основной зал — на улице Тараса Шевченко, 62А, первый этаж. Фотографии зала и тренировок клуб ещё не прислал, поэтому здесь временные заглушки."
          />
          <a
            href={club.venues[0].mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost shrink-0"
          >
            Открыть на карте
          </a>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MediaPlaceholder
            label="Общий вид зала"
            hint="горизонтальный кадр"
            className="aspect-[16/10] lg:col-span-2"
          />
          <MediaPlaceholder
            label="Тренировка группы"
            hint="горизонтальный кадр"
            className="aspect-[16/10]"
          />
        </div>

        <ul className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {amenities.map((item) => (
            <li
              key={item}
              className="bg-ink px-5 py-4 text-sm text-muted transition-colors hover:text-paper"
            >
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
