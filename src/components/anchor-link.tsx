"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function smoothBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? ("auto" as const)
    : ("smooth" as const);
}

/**
 * Ссылка на якорь с учётом текущей страницы.
 *
 * Если цель на другой странице — обычный next/link: он перейдёт и прокрутит
 * к якорю. Если мы уже на этой странице, маршрут не меняется и Next.js ничего
 * не делает, поэтому прокручиваем вручную.
 */
export function AnchorLink({
  href,
  className,
  children,
  onNavigate,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [path, hash] = href.split("#");

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();

    if (!hash || pathname !== (path || "/")) return;

    const target = document.getElementById(hash);
    if (!target) return;

    event.preventDefault();
    window.history.replaceState(null, "", href);
    target.scrollIntoView({ behavior: smoothBehavior(), block: "start" });
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}

/** Ссылка «наверх»/на главную: на самой главной прокручивает страницу к началу. */
export function HomeLink({
  href = "/",
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        if (pathname !== href) return;

        event.preventDefault();

        if (window.location.hash) {
          window.history.replaceState(null, "", href);
        }

        window.scrollTo({ top: 0, behavior: smoothBehavior() });
      }}
    >
      {children}
    </Link>
  );
}
