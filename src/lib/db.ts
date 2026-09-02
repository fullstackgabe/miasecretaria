import { supabase, currentUserId } from '@/lib/supabase'
import { demoStore } from '@/lib/demoStore'
import { isDemo, DEMO_UID } from '@/lib/config'
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

const PROFILE_COLS = 'user_id,phone,callmebot_key,callmebot_phone,whatsapp_verified,timezone'

async function uidOrThrow(): Promise<string> {
  const uid = await currentUserId()
  if (!uid) throw new Error('Sem sessão')
  return uid
}

export async function userId(): Promise<string | null> {
  if (isDemo) return DEMO_UID
  return currentUserId()
}

export async function profileGet(): Promise<Profile | null> {
  if (isDemo) return demoStore.profileGet()
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLS).maybeSingle()
  if (error) throw error
  return (data as Profile | null) ?? null
}

export async function profileUpsert(patch: Partial<Profile>): Promise<Profile> {
  if (isDemo) return demoStore.profileUpsert(patch)
  const uid = await uidOrThrow()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ user_id: uid, ...patch, updated_at: new Date().toISOString() })
    .select(PROFILE_COLS)
    .single()
  if (error) throw error
  return data as Profile
}

export async function mySubscriptionActive(): Promise<boolean> {
  if (isDemo) return true
  const { data, error } = await supabase.from('subscribers').select('active').maybeSingle()
  if (error) throw error
  return data?.active === true
}

export async function recordLead(): Promise<void> {
  if (isDemo) return
  const { data } = await supabase.auth.getUser()
  const email = data?.user?.email
  if (!email) return
  await supabase.from('leads').upsert({ email: email.toLowerCase() }, { onConflict: 'email', ignoreDuplicates: true })
}

export async function whatsappTest(): Promise<SendResult> {
  if (isDemo) return demoStore.whatsappTest()
  const { data, error } = await supabase.functions.invoke('whatsapp-test', { body: {} })
  if (error) throw error
  if (data?.error) throw new Error(String(data.error))
  return data as SendResult
}

export async function appointmentInsert(a: NewAppointment): Promise<Appointment> {
  if (isDemo) return demoStore.appointmentInsert(a)
  const uid = await uidOrThrow()
  const { data, error } = await supabase.from('appointments').insert({ user_id: uid, ...a }).select('*').single()
  if (error) throw error
  return data as Appointment
}

export async function appointmentsList(scope: AgendaScope, todayIso: string): Promise<AppointmentRow[]> {
  if (isDemo) return demoStore.appointmentsList(scope, todayIso)
  let q = supabase.from('appointments').select('*, reminders(*)')
  q = scope === 'upcoming' ? q.gte('starts_at', todayIso).order('starts_at', { ascending: true }) : q.lt('starts_at', todayIso).order('starts_at', { ascending: false }).limit(50)
  const { data, error } = await q
  if (error) throw error
  return (data as AppointmentRow[]) || []
}

export async function appointmentsBetween(fromIso: string, toIso: string): Promise<AppointmentRow[]> {
  if (isDemo) return demoStore.appointmentsBetween(fromIso, toIso)
  const { data, error } = await supabase
    .from('appointments')
    .select('*, reminders(*)')
    .gte('starts_at', fromIso)
    .lt('starts_at', toIso)
    .order('starts_at', { ascending: true })
  if (error) throw error
  return (data as AppointmentRow[]) || []
}

export async function appointmentsUpcoming(todayIso: string): Promise<Appointment[]> {
  if (isDemo) return demoStore.appointmentsUpcoming(todayIso)
  const { data } = await supabase.from('appointments').select('*').gte('starts_at', todayIso).order('starts_at').limit(100)
  return (data as Appointment[]) || []
}

export async function appointmentUpdate(id: string, patch: Partial<NewAppointment>): Promise<void> {
  if (isDemo) return demoStore.appointmentUpdate(id, patch)
  const { error } = await supabase.from('appointments').update(patch).eq('id', id)
  if (error) throw error
}

export async function appointmentDelete(id: string): Promise<void> {
  if (isDemo) return demoStore.appointmentDelete(id)
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw error
}

export async function reminderInsert(r: NewReminder): Promise<Reminder> {
  if (isDemo) return demoStore.reminderInsert(r)
  const uid = await uidOrThrow()
  const { data, error } = await supabase.from('reminders').insert({ user_id: uid, ...r }).select('*').single()
  if (error) throw error
  return data as Reminder
}

export async function reminderUpdate(id: string, patch: Partial<Reminder> & { next_attempt_at?: string | null }): Promise<void> {
  if (isDemo) return demoStore.reminderUpdate(id, patch)
  const { error } = await supabase.from('reminders').update(patch).eq('id', id)
  if (error) throw error
}

export async function chatList(limit = 50): Promise<ChatMessage[]> {
  if (isDemo) return demoStore.chatList()
  const { data } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(limit)
  return ((data as ChatMessage[]) || []).reverse()
}

export async function chatInsert(role: ChatRole, content: string, meta?: MessageMeta): Promise<void> {
  if (isDemo) return demoStore.chatInsert(role, content, meta)
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('chat_messages').insert({ user_id: uid, role, content, meta: meta ?? null })
}

export async function chatClear(): Promise<void> {
  if (isDemo) return demoStore.chatClear()
  const uid = await uidOrThrow()
  const { error } = await supabase.from('chat_messages').delete().eq('user_id', uid)
  if (error) throw error
}
