<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { AppointmentRow } from '@/types'
import { useAgendaStore } from '@/stores/agenda'
import { dayLabelForDate, todayLocal } from '@/lib/dates'
import { toast } from '@/composables/useToast'
import type { AppointmentPatch } from '@/lib/repo'
import MonthCalendar from '@/components/agenda/MonthCalendar.vue'
import AppointmentRowItem from '@/components/agenda/AppointmentRow.vue'
import EditSheet from '@/components/agenda/EditSheet.vue'
import DeleteSheet from '@/components/agenda/DeleteSheet.vue'
import Spinner from '@/components/Spinner.vue'

const agenda = useAgendaStore()
const tz = computed(() => agenda.tz())
const today = computed(() => todayLocal(tz.value))
const label = computed(() => (agenda.selected ? dayLabelForDate(agenda.selected, tz.value) : ''))

const editRow = ref<AppointmentRow | null>(null)
const deleteRow = ref<AppointmentRow | null>(null)
const busy = ref(false)

let timer: ReturnType<typeof setInterval> | null = null
const onVisible = () => {
  if (document.visibilityState === 'visible') agenda.load(true)
}

onMounted(async () => {
  await agenda.init()
  timer = setInterval(() => agenda.load(true), 60000)
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisible)
})

function isPast(row: AppointmentRow) {
  return new Date(row.starts_at).getTime() < Date.now()
}

async function save(patch: AppointmentPatch) {
  if (!editRow.value) return
  busy.value = true
  try {
    await agenda.update(editRow.value, patch)
    editRow.value = null
    toast('Compromisso atualizado.')
  } catch {
    toast('Não consegui salvar. Tenta de novo?')
  } finally {
    busy.value = false
  }
}

async function confirmDelete() {
  if (!deleteRow.value) return
  const past = isPast(deleteRow.value)
  busy.value = true
  try {
    await agenda.remove(deleteRow.value.id)
    deleteRow.value = null
    toast(past ? 'Compromisso apagado.' : 'Compromisso desmarcado.')
  } catch {
    toast(past ? 'Não consegui apagar. Tenta de novo?' : 'Não consegui desmarcar. Tenta de novo?')
  } finally {
    busy.value = false
  }
}

async function retry(id: string) {
  try {
    await agenda.retry(id)
    toast('Vou tentar mandar o aviso de novo em instantes.')
  } catch {
    toast('Não consegui reagendar o aviso.')
  }
}
</script>

<template>
  <div class="flex-1 overflow-y-auto bg-page p-4">
    <div v-if="!agenda.ready" class="flex h-full items-center justify-center">
      <Spinner />
    </div>
    <template v-else>
      <MonthCalendar
        :month="agenda.month"
        :selected="agenda.selected"
        :today="today"
        :dots="agenda.dots"
        @select="agenda.select"
        @prev="agenda.prevMonth"
        @next="agenda.nextMonth"
        @today="agenda.goToday"
      />

      <div class="mb-2 mt-1 flex items-center justify-between px-1">
        <h2 class="text-[12.5px] font-extrabold uppercase tracking-wide text-muted">{{ label }}</h2>
        <Spinner v-if="agenda.loading" :size="14" />
        <span v-else class="text-[12px] font-bold text-faint">{{ agenda.dayRows.length }}</span>
      </div>

      <div v-if="agenda.dayRows.length" class="overflow-hidden rounded-[16px] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <AppointmentRowItem
          v-for="r in agenda.dayRows"
          :key="r.id"
          :row="r"
          :tz="tz"
          :past="isPast(r)"
          @edit="editRow = $event"
          @remove="deleteRow = $event"
          @retry="retry"
        />
      </div>
      <p v-else class="px-2 py-8 text-center text-[14px] leading-relaxed text-muted">
        Nada marcado nesse dia.<br />
        Me conta no chat que eu marco. 💬
      </p>

      <EditSheet v-if="editRow" :row="editRow" :tz="tz" :busy="busy" @close="editRow = null" @save="save" />
      <DeleteSheet v-if="deleteRow" :row="deleteRow" :tz="tz" :busy="busy" :past="isPast(deleteRow)" @close="deleteRow = null" @confirm="confirmDelete" />
    </template>
  </div>
</template>
