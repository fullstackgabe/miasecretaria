import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AppointmentRow } from '@/types'
import { deleteAppointment, listMonth, retryReminder, updateAppointment, type AppointmentPatch } from '@/lib/repo'
import { addMonths, deviceTz, todayLocal, utcToZoned, ymOf } from '@/lib/dates'
import { useProfileStore } from '@/stores/profile'

export const useAgendaStore = defineStore('agenda', () => {
  const month = ref('')
  const selected = ref('')
  const rows = ref<AppointmentRow[]>([])
  const loading = ref(false)
  const ready = ref(false)

  const tz = () => useProfileStore().profile?.timezone || deviceTz()

  const byDay = computed(() => {
    const map = new Map<string, AppointmentRow[]>()
    for (const r of rows.value) {
      const d = utcToZoned(r.starts_at, tz()).date
      const list = map.get(d)
      if (list) list.push(r)
      else map.set(d, [r])
    }
    return map
  })

  const dayRows = computed(() => byDay.value.get(selected.value) ?? [])
  const dots = computed(() => new Set(byDay.value.keys()))

  async function load(silent = false) {
    if (!silent) loading.value = true
    try {
      rows.value = await listMonth(month.value, tz())
    } catch {
    } finally {
      loading.value = false
      ready.value = true
    }
  }

  async function init() {
    if (ready.value) return load(true)
    const today = todayLocal(tz())
    month.value = ymOf(today)
    selected.value = today
    await load()
  }

  function setMonth(ym: string) {
    month.value = ym
    const today = todayLocal(tz())
    selected.value = ymOf(today) === ym ? today : `${ym}-01`
    load()
  }

  const prevMonth = () => setMonth(addMonths(month.value, -1))
  const nextMonth = () => setMonth(addMonths(month.value, 1))

  function goToday() {
    const today = todayLocal(tz())
    if (month.value !== ymOf(today)) setMonth(ymOf(today))
    selected.value = today
  }

  function select(date: string) {
    selected.value = date
  }

  async function update(row: AppointmentRow, patch: AppointmentPatch) {
    await updateAppointment(row, patch)
    await load(true)
  }

  async function remove(id: string) {
    await deleteAppointment(id)
    await load(true)
  }

  async function retry(id: string) {
    await retryReminder(id)
    await load(true)
  }

  function reset() {
    month.value = ''
    selected.value = ''
    rows.value = []
    loading.value = false
    ready.value = false
  }

  return { month, selected, rows, loading, ready, byDay, dayRows, dots, tz, init, load, setMonth, prevMonth, nextMonth, goToday, select, update, remove, retry, reset }
})
