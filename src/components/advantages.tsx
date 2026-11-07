import { advantages } from "@/content/club";
import { Container } from "@/components/ui";

export function Advantages() {
  return (
    <section className="border-b border-line py-14 sm:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-14">
          <div>
            <span className="eyebrow">Почему сюда</span>
            <h2 className="mt-4 heading-display text-3xl sm:text-4xl">
              Клуб, а не просто зал
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              В «Бронксе» тренируются и те, кто впервые надевает перчатки, и
              те, кто выходит на турниры. Тренерский состав ведёт обе линии.
            </p>
          </div>

          <dl className="grid gap-px border border-line bg-line sm:grid-cols-2">
            {advantages.map((item) => (
              <div key={item.title} className="bg-ink p-6">
                <dt className="heading-display text-lg text-paper">
                  {item.title}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">
                  {item.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
