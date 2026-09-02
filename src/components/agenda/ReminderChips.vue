<script setup lang="ts">
export type ReminderChoice = number | 'custom'

defineProps<{ modelValue: ReminderChoice }>()
const emit = defineEmits<{ 'update:modelValue': [v: ReminderChoice] }>()

const OPTIONS: { label: string; value: ReminderChoice }[] = [
  { label: 'Na hora', value: 0 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '1 dia', value: 1440 },
  { label: 'Personalizado', value: 'custom' },
]
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="o in OPTIONS"
      :key="String(o.value)"
      type="button"
      class="rounded-full border px-3 py-1.5 text-[12.5px] font-bold"
      :class="o.value === modelValue ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-chip text-ink-3'"
      @click="emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
