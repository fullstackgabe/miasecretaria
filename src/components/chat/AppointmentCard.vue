<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, Clock, MapPin, Bell } from '@lucide/vue'
import type { Appointment, Conflict, ParsedAppointment, Reminder } from '@/types'
import { fullDateLabel, minutesLabel, remindLabel, shortDateTime, timeHM, utcToZoned } from '@/lib/dates'

const props = defineProps<{
  pending?: ParsedAppointment | null
  conflict?: Conflict | null
  appointment?: Appointment | null
  reminder?: Reminder | null
  reminders?: Reminder[] | null
  tz: string
}>()

const title = computed(() => props.pending?.title ?? props.appointment?.title ?? '')
const location = computed(() => props.pending?.location ?? props.appointment?.location ?? null)

const dateLabel = computed(() => {
  if (props.pending) return fullDateLabel(props.pending.date, props.tz)
  if (props.appointment) return fullDateLabel(utcToZoned(props.appointment.starts_at, props.tz).date, props.tz)
  return ''
})

const time = computed(() => {
  if (props.pending) return props.pending.time
  if (props.appointment) return timeHM(props.appointment.starts_at, props.tz)
  return ''
})

const remindText = computed(() => {
  if (props.pending) {
    const label = remindLabel(props.pending.remind)
    return label === 'na hora' ? 'Aviso: na hora' : `Aviso: ${label} e na hora`
  }
  if (!props.appointment) return ''
  const rs = props.reminders ?? (props.reminder ? [props.reminder] : [])
  if (!rs.length) return ''
  const starts = new Date(props.appointment.starts_at).getTime()
  const before = rs.find((r) => new Date(r.remind_at).getTime() < starts)
  const at = rs.find((r) => new Date(r.remind_at).getTime() === starts)
  if (!before) return at ? 'Aviso: na hora' : `Aviso: ${shortDateTime(rs[0]!.remind_at, props.tz)}`
  const diff = Math.round((starts - new Date(before.remind_at).getTime()) / 60000)
  const label = diff % 5 === 0 ? `${minutesLabel(diff)} antes` : shortDateTime(before.remind_at, props.tz)
  return at ? `Aviso: ${label} e na hora` : `Aviso: ${label}`
})
</script>

<template>
  <div>
    <p v-if="pending" class="mb-3 text-[13.5px] font-bold text-ink">Confirma pra mim? 👇</p>
    <p class="text-[17px] font-extrabold leading-tight text-ink">{{ title }}</p>
    <p class="mt-2.5 flex items-center gap-1.5 text-sm text-ink-2">
      <Calendar :size="15" class="shrink-0 text-muted" />
      {{ dateLabel }}
    </p>
    <p class="mt-[5px] flex items-center gap-1.5 text-sm text-ink-2">
      <Clock :size="15" class="shrink-0 text-muted" />
      {{ time }}
    </p>
    <p v-if="location" class="mt-[5px] flex items-center gap-1.5 text-sm text-ink-2">
      <MapPin :size="15" class="shrink-0 text-muted" />
      {{ location }}
    </p>
    <p v-if="remindText" class="mt-[5px] flex items-center gap-1.5 text-sm text-ink-2">
      <Bell :size="15" class="shrink-0 text-muted" />
      {{ remindText }}
    </p>
    <p
      v-if="pending && conflict"
      class="mt-3 rounded-[10px] border border-warn-border bg-warn-soft px-2.5 py-2 text-[13px] font-semibold leading-snug text-warn-text"
    >
      ⚠️ Você já tem <b>{{ conflict.title }}</b> às {{ conflict.time }} nesse dia.
    </p>
    <p v-if="pending" class="mt-3 text-xs text-faint">Algo errado? Me diz que eu mudo. 🙂</p>
  </div>
</template>
