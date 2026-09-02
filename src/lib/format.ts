export const onlyDigits = (s: string) => (s || '').replace(/\D/g, '')

export const uid = () => `${Date.now()}-${Math.round(Math.random() * 1e9)}`

export const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export function phoneMask(ddi: string, local: string): string {
  const d = onlyDigits(local)
  if (onlyDigits(ddi) !== '55') return d.slice(0, 14)
  const digits = d.slice(0, 11)
  const dd = digits.slice(0, 2)
  const rest = digits.slice(2)
  if (!dd) return ''
  if (!rest) return `(${dd}`
  if (rest.length <= 4) return `(${dd}) ${rest}`
  if (rest.length <= 8) return `(${dd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  return `(${dd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
}

export function toE164(ddi: string, local: string): string {
  return `+${onlyDigits(ddi)}${onlyDigits(local)}`
}

export function phonePretty(e164: string | null): string {
  if (!e164) return ''
  const d = onlyDigits(e164)
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    const dd = d.slice(2, 4)
    const rest = d.slice(4)
    return `+55 ${dd} ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`
  }
  return `+${d}`
}

export function splitE164(e164: string | null): { ddi: string; local: string } {
  const d = onlyDigits(e164 || '')
  if (!d) return { ddi: '55', local: '' }
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return { ddi: '55', local: d.slice(2) }
  if (d.length > 10) return { ddi: d.slice(0, d.length - 10), local: d.slice(-10) }
  return { ddi: d.slice(0, 1), local: d.slice(1) }
}

export function validPhone(ddi: string, local: string): string | null {
  const c = onlyDigits(ddi)
  const d = onlyDigits(local)
  if (!c || c.length > 3) return 'DDI inválido.'
  if (c === '55' && (d.length < 10 || d.length > 11)) return 'Digite o DDD e o número (10 ou 11 dígitos).'
  if (c !== '55' && (d.length < 7 || d.length > 14)) return 'Número inválido.'
  return null
}

export function validKey(key: string): string | null {
  const k = (key || '').trim()
  if (k.length < 4 || k.length > 40) return 'Cole a API key que o CallMeBot mandou.'
  if (!/^[A-Za-z0-9_-]+$/.test(k)) return 'A API key só tem letras e números.'
  return null
}

export const timeOf = (m: { id: string; created_at?: string }): string => {
  let d: Date | null = null
  if (m.created_at) d = new Date(m.created_at)
  else if (/^\d{10,}/.test(m.id)) d = new Date(Number(m.id.split('-')[0]))
  if (!d || isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
