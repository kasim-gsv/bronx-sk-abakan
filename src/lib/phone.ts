/**
 * Нормализация телефона к виду +7XXXXXXXXXX (или +<код><номер> для
 * иностранных). Нужна, чтобы «+7 913 …», «8 913 …» и «7913…» считались
 * одним номером: иначе проверка дублей на занятие обходится сменой формата.
 */

export type NormalizedPhone = {
  /** Номер в виде +79994508006 — его и сохраняем в базу. */
  value: string;
  /** Только цифры, для сравнения. */
  digits: string;
};

export function normalizePhone(raw: string): NormalizedPhone | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;

  let normalized = digits;

  // Российские номера: 10 цифр без кода страны или 11 с ведущей восьмёркой.
  if (digits.length === 10) {
    normalized = `7${digits}`;
  } else if (digits.length === 11 && digits.startsWith("8")) {
    normalized = `7${digits.slice(1)}`;
  }

  return { value: `+${normalized}`, digits: normalized };
}
