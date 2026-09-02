<script setup lang="ts">
import { computed } from 'vue'
import { MapPin, Trash2 } from '@lucide/vue'
import type { AppointmentRow } from '@/types'
import { timeHM } from '@/lib/dates'
import { latestReminder } from '@/lib/repo'
import ReminderBadge from './ReminderBadge.vue'

const props = defineProps<{ row: AppointmentRow; tz: string; past?: boolean }>()
const emit = defineEmits<{ open: [row: AppointmentRow]; remove: [row: AppointmentRow]; retry: [id: string] }>()

const reminder = computed(() => latestReminder(props.row))
</script>

<template>
  <div
    class="flex items-center gap-3 border-b border-line px-3 py-3 last:border-b-0 active:bg-page"
    :class="past ? 'opacity-70' : ''"
    role="button"
    @click="emit('open', row)"
  >
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
      type="button"
      class="shrink-0 rounded-full p-2 text-faint active:bg-danger-fill active:text-danger"
      aria-label="Desmarcar"
      @click.stop="emit('remove', row)"
    >
      <Trash2 :size="18" />
    </button>
  </div>
</template>
