import type { ReactNode } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
      )}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 className="heading-display text-balance text-3xl sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {text ? (
        <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted">
          {text}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Место под фотографию. Пока клуб не прислал снимки, показываем аккуратную
 * заглушку вместо случайных картинок из интернета.
 */
export function MediaPlaceholder({
  label,
  hint,
  className,
}: {
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden card", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_0%,#1d1d24_0%,#0b0b0f_65%)]" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/90 to-transparent" />
      <div className="relative flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <span className="eyebrow text-muted">фото</span>
        <span className="max-w-[16rem] text-sm leading-snug text-muted">
          {label}
        </span>
        {hint ? (
          <span className="text-xs text-muted/70">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}
