import type { Metadata } from "next";
import Link from "next/link";
import { club } from "@/content/club";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description:
    "Как бойцовский клуб «Бронкс» обрабатывает персональные данные, отправленные через формы сайта.",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ink py-16 sm:py-24">
      <Container className="max-w-3xl">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-paper"
        >
          ← На главную
        </Link>

        <h1 className="mt-6 heading-display text-3xl sm:text-4xl">
          Политика обработки персональных данных
        </h1>

        <div className="mt-4 border border-dashed border-line p-4 text-xs leading-relaxed text-muted/80">
          Это шаблон для сайта клуба: перед публикацией текст нужно проверить и
          дополнить реквизитами оператора (ИП/ООО, ИНН, адрес, контакты
          ответственного за обработку данных). Без этого публиковать политику
          как финальный документ нельзя.
        </div>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
          <section className="space-y-2">
            <h2 className="heading-display text-xl text-paper">1. Общие положения</h2>
            <p>
              Настоящая политика описывает, как {club.fullName} (далее — Клуб)
              обрабатывает персональные данные посетителей сайта и какие меры
              принимает для их защиты. Политика составлена в соответствии с
              Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных
              данных».
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="heading-display text-xl text-paper">2. Какие данные собираются</h2>
            <p>
              Через форму записи на сайте Клуб получает: имя, номер телефона,
              выбранное направление и комментарий, который посетитель указал
              добровольно.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="heading-display text-xl text-paper">3. Зачем нужны данные</h2>
            <p>
              Данные используются только для связи с посетителем: уточнения
              группы, времени занятия и стоимости. Клуб не передаёт данные
              третьим лицам, кроме случаев, предусмотренных законом.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="heading-display text-xl text-paper">4. Как отозвать согласие</h2>
            <p>
              Согласие можно отозвать в любой момент, позвонив по номеру{" "}
              <a
                href={`tel:${club.phone.tel}`}
                className="text-paper underline decoration-line underline-offset-2 hover:decoration-brand"
              >
                {club.phone.display}
              </a>{" "}
              или написав в сообщество Клуба. После отзыва данные удаляются, если
              нет законных оснований их хранить.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="heading-display text-xl text-paper">5. Контакты оператора</h2>
            <p>
              Реквизиты оператора (наименование, ИНН, адрес) добавляются при
              публикации сайта. Контактный телефон: {club.phone.display}.
            </p>
          </section>
        </div>
      </Container>
    </main>
  );
}
