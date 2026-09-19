<script setup lang="ts">
import { computed } from 'vue'
import { MapPin, Pencil, Trash2 } from '@lucide/vue'
import type { AppointmentRow } from '@/types'
import { timeHM } from '@/lib/dates'
import { latestReminder } from '@/lib/repo'
import ReminderBadge from './ReminderBadge.vue'

const props = defineProps<{ row: AppointmentRow; tz: string; past?: boolean }>()
const emit = defineEmits<{ edit: [row: AppointmentRow]; remove: [row: AppointmentRow]; retry: [id: string] }>()

const reminder = computed(() => latestReminder(props.row))
</script>

<template>
  <div class="flex items-center gap-3 border-b border-line px-3 py-3 last:border-b-0" :class="past ? 'opacity-70' : ''">
    <div class="w-[52px] shrink-0 text-[16px] font-extrabold text-ink">{{ timeHM(row.starts_at, tz) }}</div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-[15.5px] font-semibold text-ink">{{ row.title }}</p>
      <p v-if="row.location" class="mt-0.5 flex items-center gap-1 truncate text-[13px] text-muted">
        <MapPin :size="13" class="shrink-0" />
        {{ row.location }}
      </p>
      <div class="mt-1">
        <ReminderBadge :reminder="reminder" :tz="tz" @retry="(id) => emit('retry', id)" />
      </div>
    </div>
    <button
      v-if="!past"
      type="button"
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary-light hover:bg-primary-soft hover:text-primary active:bg-primary-soft active:text-primary"
      aria-label="Editar"
      @click="emit('edit', row)"
    >
      <Pencil :size="18" />
    </button>
    <button
      type="button"
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-danger-light hover:bg-danger-fill hover:text-danger active:bg-danger-fill active:text-danger"
      :aria-label="past ? 'Apagar' : 'Desmarcar'"
      @click="emit('remove', row)"
    >
      <Trash2 :size="19" />
    </button>
  </div>
</template>
