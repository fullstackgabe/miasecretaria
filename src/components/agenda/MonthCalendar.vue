<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { monthGrid, monthLabel } from '@/lib/dates'

const props = defineProps<{ month: string; selected: string; today: string; dots: Set<string> }>()
const emit = defineEmits<{ select: [date: string]; prev: []; next: []; today: [] }>()

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const cells = computed(() => monthGrid(props.month))
const label = computed(() => monthLabel(props.month))
const showToday = computed(() => props.today.slice(0, 7) !== props.month || props.selected !== props.today)
</script>

<template>
  <div class="card">
    <div class="mb-2 flex items-center justify-between">
      <button type="button" class="rounded-full p-1.5 text-ink-3 active:bg-chip" aria-label="Mês anterior" @click="emit('prev')">
        <ChevronLeft :size="20" />
      </button>
      <div class="flex items-center gap-2">
        <span class="text-[15px] font-extrabold text-ink">{{ label }}</span>
        <button
          v-if="showToday"
          type="button"
          class="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary"
          @click="emit('today')"
        >
          Hoje
        </button>
      </div>
      <button type="button" class="rounded-full p-1.5 text-primary active:bg-chip" aria-label="Próximo mês" @click="emit('next')">
        <ChevronRight :size="20" />
      </button>
    </div>
    <div class="mb-1 grid grid-cols-7">
      <span v-for="(w, i) in WEEK" :key="i" class="text-center text-[11.5px] font-bold text-faint">{{ w }}</span>
    </div>
    <div class="grid grid-cols-7 gap-y-1">
      <div v-for="(d, i) in cells" :key="i" class="flex h-9 items-center justify-center">
        <button
          v-if="d"
          type="button"
          class="relative flex h-8 w-8 items-center justify-center rounded-full text-[13.5px]"
          :class="[
            d === selected ? 'bg-primary font-extrabold text-white' : d === today ? 'border border-primary font-bold text-primary' : d < today ? 'text-muted' : 'text-ink',
          ]"
          @click="emit('select', d)"
        >
          {{ Number(d.slice(8, 10)) }}
          <span
            v-if="dots.has(d)"
            class="absolute bottom-[3px] h-1 w-1 rounded-full"
            :class="d === selected ? 'bg-white' : 'bg-primary'"
          ></span>
        </button>
      </div>
    </div>
  </div>
</template>
