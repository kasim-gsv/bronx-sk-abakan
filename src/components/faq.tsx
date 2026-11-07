import { club, faq } from "@/content/club";
import { Container, SectionHeading } from "@/components/ui";

export function Faq() {
  return (
    <section className="border-b border-line py-16 sm:py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionHeading
              eyebrow="Вопросы"
              title="Что обычно спрашивают"
              text="Если ответа нет ниже — позвоните или напишите в мессенджер, ответим по вашей ситуации."
            />
            <a
              href={club.links.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost mt-6"
            >
              Написать в Telegram
            </a>
          </div>

          <div className="divide-y divide-line border-y border-line">
            {faq.map((item) => (
              <details key={item.q} className="group py-1">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left">
                  <span className="text-base font-medium text-paper">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-brand-hi transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 pr-8 text-sm leading-relaxed text-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
