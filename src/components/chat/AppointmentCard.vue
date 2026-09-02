<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, Clock, MapPin, Bell } from '@lucide/vue'
import type { Appointment, Conflict, ParsedAppointment, Reminder } from '@/types'
import { fullDateLabel, remindLabel, shortDateTime, timeHM, utcToZoned } from '@/lib/dates'
import { resolveTimes } from '@/lib/repo'

const props = defineProps<{
  pending?: ParsedAppointment | null
  conflict?: Conflict | null
  appointment?: Appointment | null
  reminder?: Reminder | null
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
    try {
      const { remind_at } = resolveTimes(props.pending, props.tz)
      return `Aviso: ${label} → ${shortDateTime(remind_at, props.tz)}`
    } catch {
      return `Aviso: ${label}`
    }
  }
  if (props.reminder) return `Aviso: ${shortDateTime(props.reminder.remind_at, props.tz)}`
  return ''
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
    <p v-if="pending" class="mt-3 text-xs text-faint">Se algo estiver errado, é só me dizer que eu mudo 🙂</p>
  </div>
</template>
