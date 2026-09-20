import * as db from '@/lib/db'
import { monthRangeUtc, startOfTodayUtc, utcToZoned, zonedToUtc } from '@/lib/dates'
import type { AgendaScope, Appointment, AppointmentRow, Conflict, ParsedAppointment, Reminder } from '@/types'

export class PastError extends Error {
  constructor() {
    super('past')
  }
}

export function resolveTimes(p: ParsedAppointment, tz: string, now = new Date()): { starts_at: string; remind_at: string } {
  const starts = zonedToUtc(p.date, p.time, tz)
  if (starts.getTime() <= now.getTime()) throw new PastError()
  let remind =
    p.remind.kind === 'before'
      ? new Date(starts.getTime() - p.remind.minutes * 60000)
      : zonedToUtc(p.remind.date, p.remind.time, tz)
  if (remind.getTime() > starts.getTime()) remind = starts
  const floor = new Date(now.getTime() + 60000)
  if (remind.getTime() < floor.getTime()) remind = floor.getTime() > starts.getTime() ? starts : floor
  return { starts_at: starts.toISOString(), remind_at: remind.toISOString() }
}

export async function addAppointment(
  p: ParsedAppointment,
  tz: string,
): Promise<{ appointment: Appointment; reminder: Reminder; reminders: Reminder[] }> {
  const { starts_at, remind_at } = resolveTimes(p, tz)
  const appointment = await db.appointmentInsert({ title: p.title, starts_at, location: p.location, notes: null })
  const reminder = await db.reminderInsert({ appointment_id: appointment.id, remind_at })
  const reminders = [reminder]
  if (remind_at !== starts_at) reminders.push(await db.reminderInsert({ appointment_id: appointment.id, remind_at: starts_at }))
  return { appointment, reminder, reminders }
}

export async function listAppointments(scope: AgendaScope, tz: string): Promise<AppointmentRow[]> {
  const rows = await db.appointmentsList(scope, startOfTodayUtc(tz).toISOString())
  return rows.map((r) => ({
    ...r,
    reminders: [...(r.reminders || [])].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
  }))
}

export async function upcomingAppointments(tz: string): Promise<Appointment[]> {
  return db.appointmentsUpcoming(startOfTodayUtc(tz).toISOString())
}

export function findConflict(p: ParsedAppointment, rows: Appointment[], tz: string): Conflict | null {
  const [h, m] = p.time.split(':').map(Number)
  const mins = h! * 60 + m!
  for (const a of rows) {
    const l = utcToZoned(a.starts_at, tz)
    if (l.date !== p.date) continue
    const [ah, am] = l.time.split(':').map(Number)
    if (Math.abs(ah! * 60 + am! - mins) < 60) return { title: a.title, time: l.time }
  }
  return null
}

export async function listMonth(ym: string, tz: string): Promise<AppointmentRow[]> {
  const { from, to } = monthRangeUtc(ym, tz)
  const rows = await db.appointmentsBetween(from, to)
  return rows.map((r) => ({
    ...r,
    reminders: [...(r.reminders || [])].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
  }))
}

const sameInstant = (a: string, b: string) => new Date(a).getTime() === new Date(b).getTime()

export function atReminder(row: AppointmentRow): Reminder | null {
  return row.reminders.find((r) => sameInstant(r.remind_at, row.starts_at)) ?? null
}

export function beforeReminder(row: AppointmentRow): Reminder | null {
  return row.reminders.find((r) => !sameInstant(r.remind_at, row.starts_at)) ?? null
}

export function reminderSummary(row: AppointmentRow): Reminder | null {
  const rs = row.reminders
  const failed = rs.find((r) => r.status === 'failed')
  if (failed) return failed
  const live = rs.filter((r) => r.status === 'pending' || r.status === 'sending').sort((a, b) => a.remind_at.localeCompare(b.remind_at))
  if (live[0]) return live[0]
  return rs.filter((r) => r.status === 'sent').sort((a, b) => (b.sent_at || '').localeCompare(a.sent_at || ''))[0] ?? null
}

export type AppointmentPatch = { title: string; starts_at: string; location: string | null; remind_at: string }

const RESET = { status: 'pending' as const, attempts: 0, next_attempt_at: null, last_error: null }

export async function updateAppointment(row: AppointmentRow, patch: AppointmentPatch): Promise<void> {
  await db.appointmentUpdate(row.id, { title: patch.title, starts_at: patch.starts_at, location: patch.location })
  const now = Date.now()
  const starts = new Date(patch.starts_at).getTime()
  let remind = new Date(patch.remind_at).getTime()
  if (remind > starts) remind = starts
  if (remind < now + 60000) remind = Math.min(now + 60000, starts)
  const remind_at = new Date(remind).toISOString()
  const before = beforeReminder(row)
  if (remind < starts) {
    if (before && before.status !== 'sent') await db.reminderUpdate(before.id, { remind_at, ...RESET })
    else if (remind > now) await db.reminderInsert({ appointment_id: row.id, remind_at })
  } else if (before && before.status !== 'sent') {
    await db.reminderDelete(before.id)
  }
  const at = atReminder(row)
  const startsChanged = !sameInstant(row.starts_at, patch.starts_at)
  if (at && at.status !== 'sent') {
    if (startsChanged) await db.reminderUpdate(at.id, { remind_at: patch.starts_at, ...RESET })
  } else if (!at || startsChanged) {
    await db.reminderInsert({ appointment_id: row.id, remind_at: patch.starts_at })
  }
}

export async function retryReminder(id: string): Promise<void> {
  await db.reminderUpdate(id, { status: 'pending', attempts: 0, next_attempt_at: null, last_error: null, remind_at: new Date().toISOString() })
}

export async function deleteAppointment(id: string): Promise<void> {
  await db.appointmentDelete(id)
}
