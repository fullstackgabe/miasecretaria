import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendWhatsApp } from '../_shared/callmebot.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const TEXT = '✅ *Mia conectada!*\n\nA partir de agora eu te aviso por aqui dos seus compromissos. 😉'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } })
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return json({ error: 'unauthorized' }, 401)
    const { data: p } = await sb.from('profiles').select('phone,callmebot_key,callmebot_phone').eq('user_id', user.id).maybeSingle()
    if (!p?.phone || !p?.callmebot_key) return json({ ok: false, status: 0, body: 'Cadastre o telefone e a API key primeiro.', phone: '' })
    const r = await sendWhatsApp(p.callmebot_phone || p.phone, p.callmebot_key, TEXT)
    if (r.ok && r.phone !== p.callmebot_phone) {
      await sb.from('profiles').update({ callmebot_phone: r.phone, updated_at: new Date().toISOString() }).eq('user_id', user.id)
    }
    return json(r)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}
