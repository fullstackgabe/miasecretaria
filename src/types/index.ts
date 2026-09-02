export type Remind = { kind: 'before'; minutes: number } | { kind: 'at'; date: string; time: string }

export type ParsedAppointment = {
  title: string
  date: string
  time: string
  location: string | null
  remind: Remind
}

export type Appointment = {
  id: string
  user_id?: string
  title: string
  starts_at: string
  location: string | null
  notes: string | null
  created_at?: string
}

export type ReminderStatus = 'pending' | 'sending' | 'sent' | 'failed'

export type Reminder = {
  id: string
  user_id?: string
  appointment_id: string
  remind_at: string
  status: ReminderStatus
  attempts: number
  sent_at: string | null
  last_error: string | null
  created_at?: string
}

export type AppointmentRow = Appointment & { reminders: Reminder[] }

export type Profile = {
  user_id: string
  phone: string | null
  callmebot_key: string | null
  callmebot_phone: string | null
  whatsapp_verified: boolean
  timezone: string
}

export type Conflict = { title: string; time: string }

export type MessageMeta =
  | { type: 'pending'; appointment: ParsedAppointment; conflict: Conflict | null }
  | { type: 'appointment'; appointment: Appointment; reminder: Reminder }
  | { type: 'voice'; duration: number }
  | null

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  user_id?: string
  role: ChatRole
  content: string
  meta?: MessageMeta
  created_at?: string
}

export type SendResult = { ok: boolean; status: number; body: string }

export type ConnectStep = 1 | 2 | 3

export type AuthUser = { name: string; email: string; avatar: string | null }

export type ChatItem = ChatMessage & { voiceDuration?: number }

export type NewAppointment = { title: string; starts_at: string; location: string | null; notes: string | null }

export type NewReminder = { appointment_id: string; remind_at: string }

export type AgendaScope = 'upcoming' | 'past'
