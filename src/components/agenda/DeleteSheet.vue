<script setup lang="ts">
import type { AppointmentRow } from '@/types'
import { shortDateTime } from '@/lib/dates'
import ModalSheet from '@/components/ModalSheet.vue'
import Spinner from '@/components/Spinner.vue'

defineProps<{ row: AppointmentRow; tz: string; busy: boolean; past?: boolean }>()
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <ModalSheet @close="emit('close')">
    <h2 class="mb-2 text-lg font-extrabold text-ink">{{ past ? 'Apagar compromisso?' : 'Desmarcar compromisso?' }}</h2>
    <p class="text-[15px] font-semibold text-ink">{{ row.title }}</p>
    <p class="text-[13.5px] text-muted">{{ shortDateTime(row.starts_at, tz) }}</p>
    <p class="mt-3 rounded-[12px] border border-danger-border bg-danger-soft px-3 py-2.5 text-[13.5px] font-semibold leading-snug text-danger">
      <template v-if="past">
        Tem certeza que deseja apagar?<br />
        Ele some da agenda de vez.<br />
        Essa ação não tem volta.
      </template>
      <template v-else>
        Tem certeza que deseja desmarcar?<br />
        O aviso no WhatsApp também é cancelado.<br />
        Essa ação não tem volta.
      </template>
    </p>
    <div class="mt-[18px] flex gap-2.5">
      <button type="button" class="btn-secondary" :disabled="busy" @click="emit('close')">Cancelar</button>
      <button type="button" class="btn-danger flex items-center justify-center" :disabled="busy" @click="emit('confirm')">
        <Spinner v-if="busy" light :size="18" />
        <template v-else>{{ past ? 'Apagar' : 'Desmarcar' }}</template>
      </button>
    </div>
  </ModalSheet>
</template>
