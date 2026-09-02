import { ref } from 'vue'

export type ToastItem = { id: number; text: string }

export const toasts = ref<ToastItem[]>([])

let seq = 0

export function toast(text: string, ms = 4000) {
  const id = ++seq
  toasts.value.push({ id, text })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, ms)
}
