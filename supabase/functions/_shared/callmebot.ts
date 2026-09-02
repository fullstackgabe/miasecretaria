export type SendResult = { ok: boolean; status: number; body: string; phone: string }

export function phoneVariants(phone: string): string[] {
  const d = phone.replace(/\D/g, '')
  const out = [d]
  if (d.startsWith('55') && d.length === 13 && d[4] === '9') out.push(d.slice(0, 4) + d.slice(5))
  else if (d.startsWith('55') && d.length === 12) out.push(d.slice(0, 4) + '9' + d.slice(4))
  return out
}

async function callOnce(phone: string, apikey: string, text: string): Promise<SendResult> {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&apikey=${encodeURIComponent(apikey)}&text=${encodeURIComponent(text)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  const body = (await res.text()).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)
  const ok = res.status === 200 && !/invalid|error/i.test(body)
  return { ok, status: res.status, body, phone }
}

export async function sendWhatsApp(phone: string, apikey: string, text: string): Promise<SendResult> {
  let last: SendResult | null = null
  for (const p of phoneVariants(phone)) {
    const r = await callOnce(p, apikey, text)
    if (r.ok || r.status !== 203) return r
    last = r
  }
  return last!
}
