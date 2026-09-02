<script setup lang="ts">
import { toasts } from '@/composables/useToast'
</script>

<template>
  <Teleport to="#app">
    <div class="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+12px)] z-[60] flex flex-col items-center gap-2 px-4">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="max-w-full rounded-[14px] bg-ink px-4 py-2.5 text-center text-[13.5px] font-semibold text-white shadow-lg"
        >
          {{ t.text }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
