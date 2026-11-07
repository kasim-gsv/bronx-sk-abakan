"use client";

import { useState } from "react";
import { club, leadDirections } from "@/content/club";

type Status = "idle" | "loading" | "success" | "error";

const inputClass =
  "h-12 w-full rounded-sm border border-line bg-ink px-3.5 text-sm text-paper placeholder:text-muted/60 transition-colors focus:border-brand focus:outline-none";

export function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      direction: String(data.get("direction") ?? "").trim(),
      comment: String(data.get("comment") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      consent: data.get("consent") === "on",
    };

    if (payload.name.length < 2) {
      setError("Укажите имя — так удобнее перезвонить.");
      return;
    }
    if (payload.phone.replace(/\D/g, "").length < 10) {
      setError("Проверьте номер телефона.");
      return;
    }
    if (!payload.consent) {
      setError("Нужно согласие на обработку персональных данных.");
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Не удалось отправить заявку");
      }

      setStatus("success");
      form.reset();
    } catch (submitError) {
      setStatus("error");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось отправить заявку. Позвоните нам напрямую.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="flex h-full flex-col justify-center gap-4 border border-brand/40 bg-brand-ink/25 p-6 sm:p-8">
        <p className="eyebrow">Заявка отправлена</p>
        <p className="heading-display text-2xl">Скоро свяжемся</p>
        <p className="text-sm leading-relaxed text-muted">
          Мы получили заявку и перезвоним, чтобы подобрать группу и время. Если
          удобнее сразу — напишите в мессенджер или позвоните сами.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={`tel:${club.phone.tel}`} className="btn btn-primary">
            {club.phone.display}
          </a>
          <a
            href={club.links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
          >
            WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label htmlFor="lead-name" className="text-xs text-muted">
          Имя
        </label>
        <input
          id="lead-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Как к вам обращаться"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="lead-phone" className="text-xs text-muted">
          Телефон
        </label>
        <input
          id="lead-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="+7 999 000-00-00"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="lead-direction" className="text-xs text-muted">
          Направление
        </label>
        <select
          id="lead-direction"
          name="direction"
          defaultValue={leadDirections[0]}
          className={inputClass}
        >
          {leadDirections.map((direction) => (
            <option key={direction} value={direction} className="bg-ink">
              {direction}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="lead-comment" className="text-xs text-muted">
          Комментарий <span className="text-muted/60">— не обязательно</span>
        </label>
        <textarea
          id="lead-comment"
          name="comment"
          rows={3}
          placeholder="Возраст, опыт, удобное время"
          className="w-full resize-none rounded-sm border border-line bg-ink px-3.5 py-3 text-sm text-paper placeholder:text-muted/60 transition-colors focus:border-brand focus:outline-none"
        />
      </div>

      {/* Ловушка для спам-ботов: люди это поле не видят и не заполняют. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="lead-company">Компания</label>
        <input id="lead-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3 text-xs leading-relaxed text-muted">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
        />
        <span>
          Согласен(на) на обработку персональных данных в соответствии с{" "}
          <a
            href="/privacy"
            className="text-paper underline decoration-line underline-offset-2 hover:decoration-brand"
          >
            политикой
          </a>{" "}
          и на связь по указанному телефону.
        </span>
      </label>

      {error ? (
        <p role="alert" className="text-sm text-brand-hi">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Отправляем…" : "Записаться"}
      </button>

      <p className="text-[0.68rem] leading-relaxed text-muted/60">
        Отправляя форму, вы соглашаетесь с обработкой персональных данных.
        Заявка уходит администратору клуба.
      </p>
    </form>
  );
}
