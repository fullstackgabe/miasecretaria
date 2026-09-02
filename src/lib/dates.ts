import { DEFAULT_TZ } from '@/lib/config'
import type { Remind } from '@/types'

const pad = (n: number) => String(n).padStart(2, '0')

export function deviceTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ
  } catch {
    return DEFAULT_TZ
  }
}

function parts(d: Date, tz: string): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  )
}

function tzOffsetMs(utcMs: number, tz: string): number {
  const p = parts(new Date(utcMs), tz)
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second))
  return asUtc - utcMs
}

export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const guess = Date.UTC(y!, m! - 1, d!, hh!, mm!)
  const offset = tzOffsetMs(guess, tz)
  let result = guess - offset
  const offset2 = tzOffsetMs(result, tz)
  if (offset2 !== offset) result = guess - offset2
  return new Date(result)
}

export function utcToZoned(iso: string | Date, tz: string): { date: string; time: string } {
  const p = parts(typeof iso === 'string' ? new Date(iso) : iso, tz)
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` }
}

export function todayLocal(tz: string): string {
  return utcToZoned(new Date(), tz).date
}

export function startOfTodayUtc(tz: string): Date {
  return zonedToUtc(todayLocal(tz), '00:00', tz)
}

export function weekdayShort(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: tz, weekday: 'short' }).format(d).replace('.', '')
}

export function dmLabel(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: tz, day: '2-digit', month: '2-digit' }).format(d)
}

export function timeHM(iso: string, tz: string): string {
  return utcToZoned(iso, tz).time
}

export function fullDateLabel(date: string, tz: string): string {
  const d = zonedToUtc(date, '12:00', tz)
  return `${weekdayShort(d, tz)}, ${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`
}

export function shortDateTime(iso: string, tz: string): string {
  const d = new Date(iso)
  return `${weekdayShort(d, tz)}, ${dmLabel(d, tz)} às ${timeHM(iso, tz)}`
}

export function dayLabel(iso: string, tz: string): string {
  const d = new Date(iso)
  const target = utcToZoned(d, tz).date
  const today = todayLocal(tz)
  const tomorrow = utcToZoned(new Date(Date.now() + 86400000), tz).date
  const wd = weekdayShort(d, tz)
  const dm = dmLabel(d, tz)
  if (target === today) return `Hoje · ${wd}, ${dm}`
  if (target === tomorrow) return `Amanhã · ${wd}, ${dm}`
  return target.slice(0, 4) === today.slice(0, 4) ? `${wd}, ${dm}` : `${wd}, ${dm}/${target.slice(0, 4)}`
}

export function countdown(iso: string): string {
  const min = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (min < -1) return 'Já começou! ⏰'
  if (min <= 1) return 'É agora! ⏰'
  if (min < 60) return `Faltam ${min} min. ⏰`
  if (min < 1440) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `Faltam ${h}h${m ? pad(m) : ''}. ⏰`
  }
  const days = Math.round(min / 1440)
  return days === 1 ? 'É amanhã. 📌' : `Faltam ${days} dias. 📌`
}

export function minutesLabel(n: number): string {
  if (n <= 0) return 'na hora'
  if (n < 60) return `${n} min`
  if (n % 1440 === 0) {
    const d = n / 1440
    return d === 1 ? '1 dia' : `${d} dias`
  }
  const h = Math.floor(n / 60)
  const m = n % 60
  return m ? `${h}h${pad(m)}` : `${h}h`
}

export function remindLabel(remind: Remind): string {
  if (remind.kind === 'before') return remind.minutes <= 0 ? 'na hora' : `${minutesLabel(remind.minutes)} antes`
  return `dia ${remind.date.slice(8, 10)}/${remind.date.slice(5, 7)} às ${remind.time}`
}

export function ymOf(date: string): string {
  return date.slice(0, 7)
}

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y!, m! - 1 + n, 1))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const name = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y!, m! - 1, 1)))
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`
}

export function monthGrid(ym: string): (string | null)[] {
  const [y, m] = ym.split('-').map(Number)
  const offset = new Date(Date.UTC(y!, m! - 1, 1)).getUTCDay()
  const days = new Date(Date.UTC(y!, m!, 0)).getUTCDate()
  const cells: (string | null)[] = Array.from({ length: offset }, () => null)
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${pad(d)}`)
  while (cells.length % 7) cells.push(null)
  return cells
}

export function monthRangeUtc(ym: string, tz: string): { from: string; to: string } {
  return {
    from: zonedToUtc(`${ym}-01`, '00:00', tz).toISOString(),
    to: zonedToUtc(`${addMonths(ym, 1)}-01`, '00:00', tz).toISOString(),
  }
}

export function dayLabelForDate(date: string, tz: string): string {
  return dayLabel(zonedToUtc(date, '12:00', tz).toISOString(), tz)
}

export function relativeDateTime(iso: string, tz: string): string {
  const target = utcToZoned(iso, tz).date
  const today = todayLocal(tz)
  const tomorrow = utcToZoned(new Date(Date.now() + 86400000), tz).date
  const hm = timeHM(iso, tz)
  if (target === today) return `hoje às ${hm}`
  if (target === tomorrow) return `amanhã às ${hm}`
  return `${dmLabel(new Date(iso), tz)} às ${hm}`
}
