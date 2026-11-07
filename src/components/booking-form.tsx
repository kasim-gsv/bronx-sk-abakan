"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "h-12 w-full rounded-sm border border-line bg-ink px-3.5 text-sm text-paper placeholder:text-muted/60 transition-colors focus:border-brand focus:outline-none";

export function BookingForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const data = new FormData(event.currentTarget);
    const payload = {
      sessionId,
      name: String(data.get("name") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      consent: data.get("consent") === "on",
    };

    if (payload.name.length < 2) {
      setError("Укажите имя.");
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
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as
        | { token?: string; error?: string }
        | null;

      if (!response.ok || !body?.token) {
        throw new Error(body?.error ?? "Не удалось записаться.");
      }

      router.push(`/booking/${body.token}`);
    } catch (submitError) {
      setStatus("idle");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось записаться. Позвоните нам.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label htmlFor="booking-name" className="text-xs text-muted">
          Имя
        </label>
        <input
          id="booking-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Как к вам обращаться"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="booking-phone" className="text-xs text-muted">
          Телефон
        </label>
        <input
          id="booking-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="+7 999 000-00-00"
          className={inputClass}
        />
      </div>

      <label className="flex items-start gap-3 text-xs leading-relaxed text-muted">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
        />
        <span>
          Согласен(на) на обработку персональных данных согласно{" "}
          <a
            href="/privacy"
            className="text-paper underline decoration-line underline-offset-2 hover:decoration-brand"
          >
            политике
          </a>
          .
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
        {status === "loading" ? "Записываем…" : "Записаться"}
      </button>

      <p className="text-[0.68rem] leading-relaxed text-muted/60">
        Ссылка для отмены придёт на экране подтверждения — сохраните её.
      </p>
    </form>
  );
}
