import { club, prices } from "@/content/club";
import { Container, SectionHeading } from "@/components/ui";

export function Prices() {
  return (
    <section id="prices" className="border-b border-line py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Цены"
          title="Стоимость занятий"
          text="Формат и цена зависят от направления. Ниже — ориентиры; актуальные суммы и условия абонементов подтверждайте по телефону."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prices.map((item) => (
            <article
              key={item.id}
              className="card flex flex-col gap-3 p-6 transition-colors hover:border-brand/50"
            >
              <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-muted">
                {item.title}
              </h3>
              <p className="heading-display text-3xl text-paper">
                {item.price}
              </p>
              <p className="mt-auto pt-2 text-xs leading-relaxed text-muted/80">
                {item.note}
              </p>
              {item.needsData ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-muted/70">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
                  уточняется
                </span>
              ) : null}
            </article>
          ))}

          <article className="flex flex-col justify-between gap-4 border border-brand/40 bg-brand-ink/30 p-6">
            <div className="space-y-2">
              <h3 className="heading-display text-2xl">Не знаете, с чего начать?</h3>
              <p className="text-sm leading-relaxed text-muted">
                Позвоните — подскажем направление, группу и стоимость под вашу
                задачу.
              </p>
            </div>
            <a href={`tel:${club.phone.tel}`} className="btn btn-primary">
              {club.phone.display}
            </a>
          </article>
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted/70">
          Персональная тренировка — «от 2 000 ₽» по данным городского каталога
          Zoon. Остальные цены на сайте не опубликованы, чтобы не вводить в
          заблуждение: их нужно подтвердить у клуба.
        </p>
      </Container>
    </section>
  );
}
