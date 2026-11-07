import { audiences } from "@/content/club";
import { Container, SectionHeading } from "@/components/ui";

export function Audiences() {
  return (
    <section className="border-b border-line py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Кому подойдёт"
          title="Выберите свой старт"
          text="Занятия идут в разных группах: новичкам не нужно тянуться за профи, а спортсменам — ждать остальных."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {audiences.map((item, index) => (
            <article
              key={item.id}
              className="group relative flex flex-col gap-3 border border-line bg-surface p-6 transition-colors hover:border-brand/60 hover:bg-surface-2"
            >
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">{item.eyebrow}</span>
                <span className="heading-display text-xl text-muted/40">
                  0{index + 1}
                </span>
              </div>
              <h3 className="heading-display text-2xl">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{item.text}</p>
              <ul className="mt-2 space-y-2 border-t border-line pt-4 text-xs text-muted">
                {item.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden className="text-brand-hi">
                      /
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
