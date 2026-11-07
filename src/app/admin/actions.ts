"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  cancelSession,
  createSession,
  deleteSession,
  setUserRole,
  updateBookingStatus,
  type BookingStatus,
} from "@/lib/schedule";

function text(formData: FormData, name: string, maxLength = 200) {
  return String(formData.get(name) ?? "").trim().slice(0, maxLength);
}

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/schedule");
}

export async function createSessionAction(formData: FormData) {
  await requireAdmin();

  const direction = text(formData, "direction", 60);
  const date = text(formData, "date", 10);
  const startTime = text(formData, "time", 5);
  const audience = text(formData, "audience", 40);
  const coach = text(formData, "coach", 60);
  const note = text(formData, "note", 300);
  const capacity = Number(formData.get("capacity") ?? 12);
  const durationMin = Number(formData.get("duration") ?? 90);

  if (direction.length < 2) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  if (!/^\d{2}:\d{2}$/.test(startTime)) return;

  createSession({
    direction,
    date,
    startTime,
    audience: audience || undefined,
    coach: coach || undefined,
    note: note || undefined,
    capacity: Number.isFinite(capacity)
      ? Math.min(100, Math.max(1, Math.trunc(capacity)))
      : 12,
    durationMin: Number.isFinite(durationMin)
      ? Math.min(240, Math.max(15, Math.trunc(durationMin)))
      : 90,
  });

  refresh();
}

export async function cancelSessionAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "sessionId", 60);
  if (id) cancelSession(id);
  refresh();
}

export async function deleteSessionAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "sessionId", 60);
  if (id) deleteSession(id);
  refresh();
}

const allowedStatuses: BookingStatus[] = [
  "booked",
  "cancelled",
  "visited",
  "no_show",
];

export async function markBookingAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "bookingId", 60);
  const status = text(formData, "status", 20) as BookingStatus;
  if (id && allowedStatuses.includes(status)) {
    updateBookingStatus(id, status);
  }
  refresh();
}

export async function setRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "userId", 60);
  const role = text(formData, "role", 20);

  if (!id || (role !== "ADMIN" && role !== "STUDENT")) return;
  // Не даём снять права с самого себя, чтобы случайно не остаться без админки.
  if (id === admin.id) return;

  setUserRole(id, role);
  refresh();
}
