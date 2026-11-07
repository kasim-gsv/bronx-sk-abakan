import { club } from "@/content/club";
import { Container, SectionHeading } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";

export function Contacts() {
  const [mainVenue, secondVenue] = club.venues;

  return (
    <section id="contacts" className="border-b border-line bg-ink-2 py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Контакты"
          title="Записаться и приехать"
          text="Позвоните, напишите в мессенджер или оставьте заявку — администратор подскажет группу, время и стоимость."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="flex flex-col gap-4">
            <div className="card p-6">
              <p className="eyebrow">Телефон и мессенджеры</p>
              <a
                href={`tel:${club.phone.tel}`}
                className="mt-3 block heading-display text-3xl text-paper transition-colors hover:text-brand-hi sm:text-4xl"
              >
                {club.phone.display}
              </a>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <a
                  href={club.links.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost w-full px-3 text-[0.72rem]"
                >
                  WhatsApp
                </a>
                <a
                  href={club.links.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost w-full px-3 text-[0.72rem]"
                >
                  Telegram
                </a>
                <a
                  href={club.links.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost w-full px-3 text-[0.72rem]"
                >
                  ВКонтакте
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card p-6">
                <p className="eyebrow">Основной зал</p>
                <p className="mt-3 text-sm font-medium leading-relaxed text-paper">
                  {mainVenue.address}
                </p>
                <p className="mt-1 text-xs text-muted">{mainVenue.details}</p>
                {mainVenue.mapUrl ? (
                  <a
                    href={mainVenue.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-xs uppercase tracking-[0.16em] text-brand-hi underline-offset-4 hover:underline"
                  >
                    Открыть карту
                  </a>
                ) : null}
              </div>

              <div className="card p-6">
                <p className="eyebrow">Второй зал</p>
                <p className="mt-3 text-sm font-medium leading-relaxed text-paper">
                  {secondVenue.address}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Адрес и расписание уточняются у клуба.
                </p>
              </div>
            </div>

            <div className="card p-6">
              <p className="eyebrow">Режим работы</p>
              <dl className="mt-3 divide-y divide-line text-sm">
                {club.hours.map((row) => (
                  <div
                    key={row.days}
                    className="flex items-center justify-between py-2.5"
                  >
                    <dt className="text-muted">{row.days}</dt>
                    <dd className="font-medium text-paper">{row.time}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-muted/70">
                В выходные и праздники график может меняться — уточняйте по
                телефону.
              </p>
            </div>
          </div>

          <div id="lead" className="card scroll-mt-24 p-6 sm:p-8">
            <p className="eyebrow">Заявка</p>
            <h3 className="mt-3 heading-display text-2xl">
              Записаться на тренировку
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Оставьте имя и телефон — перезвоним и подберём группу. Обычно
              отвечаем в течение дня.
            </p>
            <div className="mt-6">
              <LeadForm />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
