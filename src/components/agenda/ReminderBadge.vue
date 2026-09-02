<script setup lang="ts">
import { computed } from 'vue'
import type { Reminder } from '@/types'
import { relativeDateTime } from '@/lib/dates'

const props = defineProps<{ reminder: Reminder | null; tz: string }>()
const emit = defineEmits<{ retry: [id: string] }>()

const view = computed(() => {
  const r = props.reminder
  if (!r) return { text: 'Sem aviso', cls: 'text-faint', retry: false, title: '' }
  if (r.status === 'sent') return { text: `✅ Avisado ${r.sent_at ? relativeDateTime(r.sent_at, props.tz) : ''}`, cls: 'text-success', retry: false, title: '' }
  if (r.status === 'sending') return { text: '⏳ Enviando…', cls: 'text-muted', retry: false, title: '' }
  if (r.status === 'failed') return { text: '⚠️ Aviso falhou', cls: 'text-danger', retry: true, title: r.last_error || '' }
  return { text: `🔔 Aviso: ${relativeDateTime(r.remind_at, props.tz)}`, cls: 'text-primary', retry: false, title: '' }
})
</script>

<template>
  <span class="inline-flex flex-wrap items-center gap-x-1.5 text-[12px] font-bold" :class="view.cls" :title="view.title">
    {{ view.text }}
    <button
      v-if="view.retry && reminder"
      type="button"
      class="underline underline-offset-2"
      @click.stop="emit('retry', reminder.id)"
    >
      Tentar de novo
    </button>
  </span>
</template>
