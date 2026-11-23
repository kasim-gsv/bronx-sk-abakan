import Link from "next/link";
import { club } from "@/content/club";
import { Container } from "@/components/ui";

const facts = [
  { label: "Адрес", value: "Тараса Шевченко, 62А" },
  { label: "График", value: "Пн–Сб, 09:00–22:00" },
  { label: "Направления", value: "8 секций в одном зале" },
  { label: "Формат", value: "Группы и персонально" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_15%_0%,rgba(225,29,46,0.18),transparent_65%)]"
      />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-40" />

      <Container className="relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-14 lg:py-24">
        <div className="lg:col-span-7">
          <p className="eyebrow">Абакан · единоборства для взрослых и детей</p>

          <h1 className="mt-5 heading-display">
            <span className="block text-[clamp(4rem,15vw,9rem)] text-paper">
              {club.latinName}
            </span>
            <span className="mt-1 block text-lg font-medium tracking-[0.18em] text-brand-hi sm:text-xl">
              бойцовский клуб
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
            Смешанные единоборства, бокс, бразильское джиу-джитсу, грэпплинг,
            борьба и кикбоксинг. Группы для новичков, детей и спортсменов,
            которые готовятся к соревнованиям.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/#lead" className="btn btn-primary">
              Записаться на тренировку
            </Link>
            <a href={`tel:${club.phone.tel}`} className="btn btn-ghost">
              {club.phone.display}
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-[0.66rem] font-medium uppercase tracking-[0.2em] text-muted/70">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm font-medium text-paper">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden card">
            <div className="absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_20%,rgba(225,29,46,0.35),transparent_62%)]" />
            <div aria-hidden className="bg-grid absolute inset-0 opacity-50" />

            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
            />
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-[48%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
            />
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/40"
            />

            <div className="relative flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="heading-display text-5xl tracking-[0.08em] text-paper/90">
                {club.latinName}
              </span>
              <span className="max-w-[15rem] text-xs leading-relaxed text-muted">
                Здесь будет фото тренировки или команды — пришлите снимки,
                и мы поставим их вместо заглушки.
              </span>
            </div>

            <a
              href={club.rating.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-sm border border-line bg-ink/80 px-3 py-2.5 backdrop-blur transition-colors hover:border-brand/60"
            >
              <span className="text-xs text-muted">
                Рейтинг на {club.rating.source}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-paper">
                <span className="text-brand-hi">★</span>
                {club.rating.value}
                <span className="text-xs font-normal text-muted">
                  ({club.rating.count})
                </span>
              </span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
