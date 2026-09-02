<script setup lang="ts">
import type { ConnectStep } from '@/types'

defineProps<{ step: ConnectStep }>()

const labels = ['WhatsApp', 'CallMeBot', 'Teste']
</script>

<template>
  <div class="mb-5 flex items-start justify-center">
    <template v-for="(label, i) in labels" :key="label">
      <div class="flex w-[76px] flex-col items-center gap-1.5">
        <div class="h-2.5 w-2.5 rounded-full" :class="i + 1 <= step ? 'bg-primary' : 'bg-line'"></div>
        <span class="text-[12px] font-bold" :class="i + 1 === step ? 'text-primary' : 'text-muted'">{{ label }}</span>
      </div>
      <div v-if="i < 2" class="mt-1 h-0.5 w-8 -mx-4" :class="i + 1 < step ? 'bg-primary' : 'bg-line'"></div>
    </template>
  </div>
</template>
