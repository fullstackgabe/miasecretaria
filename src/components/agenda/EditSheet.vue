<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AppointmentRow } from '@/types'
import { utcToZoned, zonedToUtc } from '@/lib/dates'
import { beforeReminder, type AppointmentPatch } from '@/lib/repo'
import ModalSheet from '@/components/ModalSheet.vue'
import Spinner from '@/components/Spinner.vue'

const props = defineProps<{ row: AppointmentRow; tz: string; busy: boolean }>()
const emit = defineEmits<{ close: []; save: [patch: AppointmentPatch] }>()

type Unit = 'min' | 'h' | 'd'
const UNIT_MINUTES: Record<Unit, number> = { min: 1, h: 60, d: 1440 }

const start = utcToZoned(props.row.starts_at, props.tz)
const title = ref(props.row.title)
const date = ref(start.date)
const time = ref(start.time)
const location = ref(props.row.location ?? '')
const error = ref<string | null>(null)

const reminder = beforeReminder(props.row)
const initialDiff = reminder ? Math.max(1, Math.round((new Date(props.row.starts_at).getTime() - new Date(reminder.remind_at).getTime()) / 60000)) : 10
const initialUnit: Unit = initialDiff % 1440 === 0 ? 'd' : initialDiff % 60 === 0 ? 'h' : 'min'
const amount = ref(initialDiff / UNIT_MINUTES[initialUnit])
const unit = ref<Unit>(initialUnit)

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
  const minutes = Math.floor(Number(amount.value))
  if (!Number.isFinite(minutes) || minutes < 1) {
    error.value = 'Coloque com quanto tempo de antecedência quer o aviso.'
    return
  }
  const remind = new Date(starts.getTime() - minutes * UNIT_MINUTES[unit.value] * 60000)
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
    <label class="label">Aviso antecipado</label>
    <div class="flex items-center gap-2">
      <input v-model="amount" type="number" min="1" inputmode="numeric" class="field w-[84px] text-center" />
      <select v-model="unit" class="field flex-1">
        <option value="min">minutos</option>
        <option value="h">horas</option>
        <option value="d">dias</option>
      </select>
      <span class="text-sm font-semibold text-ink-2">antes</span>
    </div>
    <p class="mt-1.5 text-[12px] text-faint">Na hora do compromisso você recebe outro aviso.</p>
    <p v-if="alreadySent" class="mt-3 rounded-[10px] border border-warn-border bg-warn-soft px-2.5 py-2 text-[12.5px] font-semibold leading-snug text-warn-text">
      O aviso antecipado desse compromisso já foi enviado. Mudar o aviso cria um novo.
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
