import { club } from "@/content/club";
import { Container } from "@/components/ui";

/**
 * Год берём на этапе сборки: Cache Components не разрешает читать текущее
 * время во время пререндера. После сборки значение фиксируется до следующего
 * деплоя — для копирайта это нормально.
 */
const buildYear = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink-2 pb-24 pt-14 md:pb-14">
      <Container>
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <p className="heading-display text-2xl tracking-[0.06em]">
              {club.latinName}
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              {club.fullName}. {club.tagline}. {club.venues[0].address}.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/70">
              Контакты
            </p>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a
                  href={`tel:${club.phone.tel}`}
                  className="transition-colors hover:text-paper"
                >
                  {club.phone.display}
                </a>
              </li>
              <li>
                Пн–Сб 09:00–22:00, вс — выходной
              </li>
              <li>
                <a
                  href={club.links.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-paper"
                >
                  Сообщество ВКонтакте
                </a>
              </li>
              <li>
                <a
                  href={club.links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-paper"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/70">
              Документы
            </p>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a
                  href="/account"
                  className="transition-colors hover:text-paper"
                >
                  Личный кабинет
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="transition-colors hover:text-paper"
                >
                  Политика обработки персональных данных
                </a>
              </li>
            </ul>
            <p className="pt-4 text-xs leading-relaxed text-muted/70">
              Сайт находится в разработке: часть данных (расписание, цены,
              тренеры, фотографии) уточняется у клуба.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {buildYear} {club.fullName}. Все права защищены.
          </p>
          <p>Абакан, Республика Хакасия</p>
        </div>
      </Container>
    </footer>
  );
}
