<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AppointmentRow } from '@/types'
import { utcToZoned, zonedToUtc } from '@/lib/dates'
import { latestReminder, type AppointmentPatch } from '@/lib/repo'
import ModalSheet from '@/components/ModalSheet.vue'
import Spinner from '@/components/Spinner.vue'
import ReminderChips, { type ReminderChoice } from './ReminderChips.vue'

const props = defineProps<{ row: AppointmentRow; tz: string; busy: boolean }>()
const emit = defineEmits<{ close: []; save: [patch: AppointmentPatch] }>()

const PRESETS = [0, 15, 30, 60, 120, 1440]

const start = utcToZoned(props.row.starts_at, props.tz)
const title = ref(props.row.title)
const date = ref(start.date)
const time = ref(start.time)
const location = ref(props.row.location ?? '')
const error = ref<string | null>(null)

const reminder = latestReminder(props.row)
const initialDiff = reminder ? Math.round((new Date(props.row.starts_at).getTime() - new Date(reminder.remind_at).getTime()) / 60000) : 60
const initialCustom = reminder ? utcToZoned(reminder.remind_at, props.tz) : start
const choice = ref<ReminderChoice>(PRESETS.includes(initialDiff) ? initialDiff : 'custom')
const customDate = ref(initialCustom.date)
const customTime = ref(initialCustom.time)

const alreadySent = computed(() => reminder?.status === 'sent')

function save() {
  error.value = null
  if (!title.value.trim()) {
    error.value = 'Dá um nome pro compromisso.'
    return
  }
  if (!date.value || !time.value) {
    error.value = 'Preencha a data e a hora.'
    return
  }
  const starts = zonedToUtc(date.value, time.value, props.tz)
  if (starts.getTime() <= Date.now()) {
    error.value = 'O compromisso precisa estar no futuro.'
    return
  }
  const remind =
    choice.value === 'custom'
      ? zonedToUtc(customDate.value || date.value, customTime.value || time.value, props.tz)
      : new Date(starts.getTime() - choice.value * 60000)
  emit('save', {
    title: title.value.trim(),
    starts_at: starts.toISOString(),
    location: location.value.trim() || null,
    remind_at: remind.toISOString(),
  })
}
</script>

<template>
  <ModalSheet @close="emit('close')">
    <h2 class="text-lg font-extrabold text-ink">Editar compromisso</h2>
    <label class="label">Título</label>
    <input v-model="title" class="field" autocomplete="off" />
    <div class="flex gap-2">
      <div class="flex-1">
        <label class="label">Data</label>
        <input v-model="date" type="date" class="field" />
      </div>
      <div class="w-[120px]">
        <label class="label">Hora</label>
        <input v-model="time" type="time" class="field" />
      </div>
    </div>
    <label class="label">Local (opcional)</label>
    <input v-model="location" class="field" autocomplete="off" placeholder="Ex.: Clínica Sorriso" />
    <label class="label">Aviso</label>
    <ReminderChips v-model="choice" />
    <div v-if="choice === 'custom'" class="mt-2 flex gap-2">
      <input v-model="customDate" type="date" class="field flex-1" />
      <input v-model="customTime" type="time" class="field w-[120px]" />
    </div>
    <p v-if="alreadySent" class="mt-3 rounded-[10px] border border-warn-border bg-warn-soft px-2.5 py-2 text-[12.5px] font-semibold leading-snug text-warn-text">
      O aviso desse compromisso já foi enviado. Mudar o aviso cria um novo.
    </p>
    <p v-if="error" class="mt-2 text-[12.5px] font-semibold text-danger">{{ error }}</p>
    <div class="mt-[18px] flex gap-2.5">
      <button type="button" class="btn-secondary" :disabled="busy" @click="emit('close')">Cancelar</button>
      <button type="button" class="btn-primary flex items-center justify-center" :disabled="busy" @click="save">
        <Spinner v-if="busy" light :size="18" />
        <template v-else>Salvar</template>
      </button>
    </div>
  </ModalSheet>
</template>
