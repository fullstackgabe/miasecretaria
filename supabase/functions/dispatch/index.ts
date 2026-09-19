import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendWhatsApp } from '../_shared/callmebot.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')!
const DEFAULT_TZ = 'America/Sao_Paulo'
const MAX_ATTEMPTS = 5
const BATCH = 50
const GRACE_MS = 30 * 60 * 1000

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

function part(d: Date, tz: string, opts: Intl.DateTimeFormatOptions, locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, { timeZone: tz, ...opts }).format(d)
}

function dayKey(d: Date, tz: string) {
  return part(d, tz, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA')
}

function dayLabel(d: Date, tz: string) {
  const wd = part(d, tz, { weekday: 'short' }).replace('.', '')
  const dm = part(d, tz, { day: '2-digit', month: '2-digit' })
  const key = dayKey(d, tz)
  if (key === dayKey(new Date(), tz)) return `Hoje (${wd}, ${dm})`
  if (key === dayKey(new Date(Date.now() + 86400000), tz)) return `Amanhã (${wd}, ${dm})`
  return `${wd}, ${dm}`
}

function countdown(d: Date) {
  const min = Math.round((d.getTime() - Date.now()) / 60000)
  if (min < -1) return 'Já começou! ⏰'
  if (min <= 1) return 'É agora! ⏰'
  if (min < 60) return `Faltam ${min} min. ⏰`
  if (min < 1440) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `Faltam ${h}h${m ? String(m).padStart(2, '0') : ''}. ⏰`
  }
  const days = Math.round(min / 1440)
  return days === 1 ? 'É amanhã. 📌' : `Faltam ${days} dias. 📌`
}

function buildMessage(a: { title: string; starts_at: string; location: string | null }, tz: string) {
  const d = new Date(a.starts_at)
  const hm = part(d, tz, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  return [
    '🔔 *Lembrete da Mia*',
    '',
    `*${a.title}*`,
    `📅 ${dayLabel(d, tz)} às ${hm}`,
    a.location ? `📍 ${a.location}` : null,
    '',
    countdown(d),
  ].filter((l) => l !== null).join('\n')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) return json({ error: 'unauthorized' }, 401)

  const { data: claimed, error } = await sb.rpc('claim_due_reminders', { batch: BATCH, max_attempts: MAX_ATTEMPTS })
  if (error) return json({ error: error.message }, 500)

  let sent = 0, failed = 0
  for (const r of claimed || []) {
    const { data: a } = await sb.from('appointments').select('title,starts_at,location').eq('id', r.appointment_id).maybeSingle()
    const { data: p } = await sb.from('profiles').select('phone,callmebot_key,callmebot_phone,timezone,whatsapp_verified').eq('user_id', r.user_id).maybeSingle()

    let outcome: { ok: boolean; status?: number; body: string; phone?: string; final?: boolean }
    if (!a) outcome = { ok: false, body: 'compromisso não existe mais', final: true }
    else if (!p?.whatsapp_verified || !p.phone || !p.callmebot_key) outcome = { ok: false, body: 'WhatsApp não conectado', final: true }
    else if (new Date(a.starts_at).getTime() < Date.now() - GRACE_MS) outcome = { ok: false, body: 'compromisso já passou', final: true }
    else {
      try {
        outcome = await sendWhatsApp(p.callmebot_phone || p.phone, p.callmebot_key, buildMessage(a, p.timezone || DEFAULT_TZ))
        if (outcome.ok && outcome.phone && outcome.phone !== p.callmebot_phone) {
          await sb.from('profiles').update({ callmebot_phone: outcome.phone, updated_at: new Date().toISOString() }).eq('user_id', r.user_id)
        }
      } catch (e) {
        outcome = { ok: false, body: String(e) }
      }
    }

    const final = outcome.ok || outcome.final || r.attempts >= MAX_ATTEMPTS
    await sb.from('reminders').update({
      status: outcome.ok ? 'sent' : final ? 'failed' : 'pending',
      sent_at: outcome.ok ? new Date().toISOString() : null,
      next_attempt_at: outcome.ok || final ? null : new Date(Date.now() + r.attempts * 2 * 60000).toISOString(),
      last_error: outcome.ok ? null : `${outcome.status ?? ''} ${outcome.body}`.trim().slice(0, 300),
      locked_at: null,
    }).eq('id', r.id)

    outcome.ok ? sent++ : failed++
  }

  return json({ claimed: (claimed || []).length, sent, failed })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
