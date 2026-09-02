import type {
  AgendaScope,
  Appointment,
  AppointmentRow,
  ChatMessage,
  ChatRole,
  MessageMeta,
  NewAppointment,
  NewReminder,
  Profile,
  Reminder,
  SendResult,
} from '@/types'
import { DEMO_UID, DEFAULT_TZ } from '@/lib/config'
import { uid } from '@/lib/format'

const K_PROFILE = 'demo_profile_v1'
const K_APPTS = 'demo_appointments_v1'
const K_REMINDERS = 'demo_reminders_v1'
const K_CHAT = 'demo_chat_v1'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

const nowIso = () => new Date().toISOString()

const emptyProfile = (): Profile => ({
  user_id: DEMO_UID,
  phone: null,
  callmebot_key: null,
  callmebot_phone: null,
  whatsapp_verified: false,
  timezone: DEFAULT_TZ,
})

const appts = () => read<Appointment[]>(K_APPTS, [])
const rems = () => read<Reminder[]>(K_REMINDERS, [])

export const demoStore = {
  async profileGet(): Promise<Profile | null> {
    return read<Profile | null>(K_PROFILE, null)
  },
  async profileUpsert(patch: Partial<Profile>): Promise<Profile> {
    const next = { ...(read<Profile | null>(K_PROFILE, null) ?? emptyProfile()), ...patch }
    write(K_PROFILE, next)
    return next
  },
  async whatsappTest(): Promise<SendResult> {
    await new Promise((r) => setTimeout(r, 1000))
    return { ok: true, status: 200, body: 'Message queued (simulado)' }
  },

  async appointmentInsert(a: NewAppointment): Promise<Appointment> {
    const row: Appointment = { id: uid(), user_id: DEMO_UID, ...a, created_at: nowIso() }
    write(K_APPTS, [...appts(), row])
    return row
  },
  async appointmentsList(scope: AgendaScope, todayIso: string): Promise<AppointmentRow[]> {
    const all = appts()
    const list = scope === 'upcoming' ? all.filter((a) => a.starts_at >= todayIso).sort((a, b) => a.starts_at.localeCompare(b.starts_at)) : all.filter((a) => a.starts_at < todayIso).sort((a, b) => b.starts_at.localeCompare(a.starts_at)).slice(0, 50)
    const r = rems()
    return list.map((a) => ({ ...a, reminders: r.filter((x) => x.appointment_id === a.id) }))
  },
  async appointmentsBetween(fromIso: string, toIso: string): Promise<AppointmentRow[]> {
    const r = rems()
    return appts()
      .filter((a) => a.starts_at >= fromIso && a.starts_at < toIso)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .map((a) => ({ ...a, reminders: r.filter((x) => x.appointment_id === a.id) }))
  },
  async appointmentsUpcoming(todayIso: string): Promise<Appointment[]> {
    return appts().filter((a) => a.starts_at >= todayIso).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  },
  async appointmentUpdate(id: string, patch: Partial<NewAppointment>): Promise<void> {
    write(K_APPTS, appts().map((a) => (a.id === id ? { ...a, ...patch } : a)))
  },
  async appointmentDelete(id: string): Promise<void> {
    write(K_APPTS, appts().filter((a) => a.id !== id))
    write(K_REMINDERS, rems().filter((r) => r.appointment_id !== id))
  },

  async reminderInsert(r: NewReminder): Promise<Reminder> {
    const row: Reminder = { id: uid(), user_id: DEMO_UID, ...r, status: 'pending', attempts: 0, sent_at: null, last_error: null, created_at: nowIso() }
    write(K_REMINDERS, [...rems(), row])
    return row
  },
  async reminderUpdate(id: string, patch: Partial<Reminder>): Promise<void> {
    write(K_REMINDERS, rems().map((r) => (r.id === id ? { ...r, ...patch } : r)))
  },
  async remindersDue(): Promise<Reminder[]> {
    const now = nowIso()
    return rems().filter((r) => r.status === 'pending' && r.remind_at <= now)
  },
  async appointmentGet(id: string): Promise<Appointment | null> {
    return appts().find((a) => a.id === id) ?? null
  },

  async chatList(): Promise<ChatMessage[]> {
    return read<ChatMessage[]>(K_CHAT, []).slice(-50)
  },
  async chatInsert(role: ChatRole, content: string, meta?: MessageMeta): Promise<void> {
    const rows = read<ChatMessage[]>(K_CHAT, [])
    rows.push({ id: uid(), user_id: DEMO_UID, role, content, meta: meta ?? null, created_at: nowIso() })
    write(K_CHAT, rows)
  },
  async chatClear(): Promise<void> {
    write(K_CHAT, [])
  },
}
