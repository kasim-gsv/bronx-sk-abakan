import Link from "next/link";
import { club } from "@/content/club";
import { Container } from "@/components/ui";

const navigation = [
  { href: "#directions", label: "Направления" },
  { href: "#prices", label: "Цены" },
  { href: "/schedule", label: "Расписание" },
  { href: "#coaches", label: "Тренеры" },
  { href: "#contacts", label: "Контакты" },
  { href: "/account", label: "Кабинет" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="group flex items-baseline gap-3">
          <span className="heading-display text-2xl tracking-[0.06em] text-paper">
            {club.latinName}
          </span>
          <span className="hidden text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted group-hover:text-paper/80 sm:inline">
            {club.city} · единоборства
          </span>
        </Link>

        <nav aria-label="Основная навигация" className="hidden lg:block">
          <ul className="flex items-center gap-5 xl:gap-7">
            {navigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="whitespace-nowrap text-[0.82rem] text-muted transition-colors hover:text-paper xl:text-sm"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${club.phone.tel}`}
            className="hidden whitespace-nowrap text-sm font-medium text-paper transition-colors hover:text-brand-hi xl:block"
          >
            {club.phone.display}
          </a>
          <a href="#lead" className="btn btn-primary hidden sm:inline-flex">
            Записаться
          </a>
        </div>
      </Container>
    </header>
  );
}
