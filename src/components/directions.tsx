import { directions } from "@/content/club";
import { Container, SectionHeading } from "@/components/ui";

export function Directions() {
  return (
    <section id="directions" className="border-b border-line bg-ink-2 py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Направления"
          title="Что можно тренировать"
          text="Восемь секций в одном зале: от ударной техники до борьбы в партере. Можно переходить между направлениями или совмещать."
        />

        <ul className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {directions.map((direction, index) => (
            <li
              key={direction.slug}
              className="group relative flex flex-col gap-3 bg-ink p-6 transition-colors hover:bg-surface"
            >
              <span className="text-[0.68rem] font-medium tracking-[0.2em] text-muted/60">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="heading-display text-xl transition-colors group-hover:text-brand-hi">
                {direction.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                {direction.summary}
              </p>
              <span className="mt-auto pt-4 text-[0.68rem] uppercase tracking-[0.16em] text-muted/60">
                {direction.ages}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs leading-relaxed text-muted/70">
          Список направлений собран из сообщества клуба. Если направление
          набрано или, наоборот, появилось новое — уточняйте по телефону.
        </p>
      </Container>
    </section>
  );
}
