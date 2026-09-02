<script setup lang="ts">
import { computed } from 'vue'
import { onlyDigits, phoneMask } from '@/lib/format'

const props = defineProps<{ ddi: string; local: string; error?: string | null }>()
const emit = defineEmits<{ 'update:ddi': [string]; 'update:local': [string] }>()

const masked = computed(() => phoneMask(props.ddi, props.local))

function onDdi(e: Event) {
  const el = e.target as HTMLInputElement
  const v = onlyDigits(el.value).slice(0, 3)
  el.value = v
  emit('update:ddi', v)
}

function onLocal(e: Event) {
  const el = e.target as HTMLInputElement
  const v = onlyDigits(el.value).slice(0, props.ddi === '55' ? 11 : 14)
  el.value = phoneMask(props.ddi, v)
  emit('update:local', v)
}
</script>

<template>
  <div>
    <div class="flex gap-2">
      <div class="flex items-center rounded-[12px] border border-line bg-page px-3 focus-within:border-primary-border">
        <span class="text-[16px] text-muted">+</span>
        <input
          :value="ddi"
          inputmode="numeric"
          autocomplete="tel-country-code"
          aria-label="DDI"
          class="w-10 bg-transparent py-2.5 text-[16px] text-ink"
          @input="onDdi"
        />
      </div>
      <input
        :value="masked"
        inputmode="tel"
        autocomplete="tel-national"
        aria-label="Número"
        :placeholder="ddi === '55' ? '(41) 99999-9999' : 'Número'"
        class="field flex-1"
        :class="error ? 'border-danger' : ''"
        @input="onLocal"
      />
    </div>
    <p v-if="error" class="mt-1.5 text-[12.5px] font-semibold text-danger">{{ error }}</p>
  </div>
</template>
