<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, Clock, MapPin, Bell, X } from '@lucide/vue'
import type { AppointmentRow } from '@/types'
import { fullDateLabel, relativeDateTime, timeHM, utcToZoned } from '@/lib/dates'
import { latestReminder } from '@/lib/repo'
import ModalSheet from '@/components/ModalSheet.vue'

const props = defineProps<{ row: AppointmentRow; tz: string }>()
const emit = defineEmits<{ close: []; edit: []; remove: []; retry: [id: string] }>()

const reminder = computed(() => latestReminder(props.row))
const dateLabel = computed(() => fullDateLabel(utcToZoned(props.row.starts_at, props.tz).date, props.tz))
const reminderText = computed(() => {
  const r = reminder.value
  if (!r) return 'Sem aviso'
  if (r.status === 'sent') return `Avisado ${r.sent_at ? relativeDateTime(r.sent_at, props.tz) : ''} ✅`
  if (r.status === 'sending') return 'Enviando o aviso… ⏳'
  if (r.status === 'failed') return `Aviso falhou ⚠️${r.last_error ? ` (${r.last_error})` : ''}`
  return `Aviso ${relativeDateTime(r.remind_at, props.tz)} 🔔`
})
const past = computed(() => new Date(props.row.starts_at).getTime() < Date.now())
</script>

<template>
  <ModalSheet @close="emit('close')">
    <div class="flex items-start justify-between gap-3">
      <h2 class="text-[18px] font-extrabold leading-tight text-ink">{{ row.title }}</h2>
      <button type="button" class="-mr-1 -mt-1 rounded-full p-1 text-faint" aria-label="Fechar" @click="emit('close')">
        <X :size="20" />
      </button>
    </div>
    <div class="mt-3 space-y-2 text-[14.5px] text-ink-2">
      <p class="flex items-center gap-2"><Calendar :size="16" class="shrink-0 text-muted" />{{ dateLabel }}</p>
      <p class="flex items-center gap-2"><Clock :size="16" class="shrink-0 text-muted" />{{ timeHM(row.starts_at, tz) }}</p>
      <p v-if="row.location" class="flex items-center gap-2"><MapPin :size="16" class="shrink-0 text-muted" />{{ row.location }}</p>
      <p class="flex items-start gap-2">
        <Bell :size="16" class="mt-0.5 shrink-0 text-muted" />
        <span>
          {{ reminderText }}
          <button
            v-if="reminder?.status === 'failed'"
            type="button"
            class="ml-1 font-bold text-primary underline underline-offset-2"
            @click="emit('retry', reminder.id)"
          >
            Tentar de novo
          </button>
        </span>
      </p>
    </div>
    <div class="mt-5 flex gap-2.5">
      <button v-if="!past" type="button" class="btn-primary" @click="emit('edit')">Editar</button>
      <button type="button" class="btn-danger" @click="emit('remove')">Desmarcar</button>
    </div>
  </ModalSheet>
</template>
