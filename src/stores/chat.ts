import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ChatItem, MessageMeta, ParsedAppointment } from '@/types'
import { askSecretaria, loadHistory, saveMessage, clearConversation, type AskInput } from '@/lib/agent'
import { addAppointment, PastError } from '@/lib/repo'
import { useProfileStore } from '@/stores/profile'
import { deviceTz } from '@/lib/dates'
import { uid } from '@/lib/format'

export const WELCOME: ChatItem = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Olá, eu sou a Mia 👋\nSua Secretária Virtual Inteligente.\nMe informa um evento, quando e que horas quer que avise, que eu te lembro depois no WhatsApp. 📲',
}

export const SUGGESTIONS = [
  'dentista amanhã às 15h, me avisa 1h antes',
  'reunião sexta 10h, avisa 30 min antes',
  'aniversário da Ana dia 20 às 19h, avisa no dia às 9h',
  'academia hoje 18h, me lembra na hora',
  'consulta dia 15/10 às 8h30, avisa 1 dia antes',
  'o que eu tenho amanhã?',
]

const SUCCESS_LINES = [
  'Marcado! ✅\nEu te aviso no WhatsApp na hora combinada. 😉',
  'Anotado na agenda! ✅\nPode deixar que eu te lembro no WhatsApp. 📲',
  'Prontinho, tá na agenda! ✅\nQuando chegar a hora do aviso, te chamo no WhatsApp. 😊',
]

const GENERIC_ERROR = 'Ops, algo deu errado. Tenta de novo?'
const REGISTER_ERROR = 'Não consegui marcar agora. Tenta de novo?'
const CANCEL_LINE = 'Beleza, não marquei nada. Se quiser tentar de novo, é só pedir. 👍'
export const PAST_LINE = 'Esse horário já passou 🙂\nQuer marcar pra quando?'

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const typingDelay = (text: string) => Math.min(1200, 400 + (text?.length || 0) * 9)

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatItem[]>([WELCOME])
  const draft = ref('')
  const loaded = ref(false)
  const sending = ref(false)
  const typing = ref(false)
  const recording = ref(false)
  const busyId = ref<string | null>(null)
  const showClear = ref(false)
  let initialized = false

  const busy = computed(() => sending.value || typing.value)
  const showSuggestions = computed(() => messages.value.length <= 1)
  const canClear = computed(() => messages.value.length > 1)

  const tz = () => useProfileStore().profile?.timezone || deviceTz()

  async function init() {
    if (initialized) return
    initialized = true
    try {
      const rows = await loadHistory()
      const items: ChatItem[] = rows.map((r) => (r.meta?.type === 'voice' ? { ...r, voiceDuration: r.meta.duration } : r))
      messages.value = [WELCOME, ...items]
    } catch {
      messages.value = [WELCOME]
    } finally {
      loaded.value = true
    }
  }

  function reset() {
    initialized = false
    messages.value = [WELCOME]
    draft.value = ''
    loaded.value = false
    sending.value = false
    typing.value = false
    recording.value = false
    busyId.value = null
    showClear.value = false
  }

  function push(msg: ChatItem) {
    messages.value = [...messages.value, msg]
  }

  async function revealBot(msg: ChatItem) {
    typing.value = true
    await sleep(typingDelay(msg.content))
    push(msg)
    typing.value = false
  }

  async function runAsk(payload: AskInput, userText: string, voiceDuration?: number) {
    if (busy.value) return
    const userMeta: MessageMeta = voiceDuration != null ? { type: 'voice', duration: voiceDuration } : null
    push({ id: uid(), role: 'user', content: userText, voiceDuration, meta: userMeta })
    sending.value = true
    typing.value = true
    saveMessage('user', userText, userMeta).catch(() => {})
    try {
      const { reply, meta } = await askSecretaria(payload)
      await revealBot({ id: uid(), role: 'assistant', content: reply, meta })
      if (meta?.type !== 'pending') saveMessage('assistant', reply, meta).catch(() => {})
    } catch {
      await revealBot({ id: uid(), role: 'assistant', content: GENERIC_ERROR })
    } finally {
      sending.value = false
    }
  }

  function sendText() {
    const t = draft.value.trim()
    if (!t || busy.value || recording.value) return
    draft.value = ''
    runAsk({ text: t }, t)
  }

  async function confirmPending(id: string, parsed: ParsedAppointment) {
    busyId.value = id
    try {
      const { appointment, reminder } = await addAppointment(parsed, tz())
      messages.value = messages.value.filter((x) => x.id !== id)
      const meta: MessageMeta = { type: 'appointment', appointment, reminder }
      await revealBot({ id: uid(), role: 'assistant', content: '', meta })
      saveMessage('assistant', '', meta).catch(() => {})
      const ok = SUCCESS_LINES[Math.floor(Math.random() * SUCCESS_LINES.length)]!
      await revealBot({ id: uid(), role: 'assistant', content: ok })
      saveMessage('assistant', ok).catch(() => {})
    } catch (e) {
      if (e instanceof PastError) {
        messages.value = messages.value.filter((x) => x.id !== id)
        await revealBot({ id: uid(), role: 'assistant', content: PAST_LINE })
        saveMessage('assistant', PAST_LINE).catch(() => {})
      } else {
        await revealBot({ id: uid(), role: 'assistant', content: REGISTER_ERROR })
      }
    } finally {
      busyId.value = null
    }
  }

  async function cancelPending(id: string) {
    messages.value = messages.value.filter((x) => x.id !== id)
    await revealBot({ id: uid(), role: 'assistant', content: CANCEL_LINE, meta: null })
    saveMessage('assistant', CANCEL_LINE, null).catch(() => {})
  }

  function botNote(content: string) {
    push({ id: uid(), role: 'assistant', content })
  }

  async function clear() {
    try {
      await clearConversation()
    } catch {}
    messages.value = [WELCOME]
    showClear.value = false
  }

  return {
    messages,
    draft,
    loaded,
    sending,
    typing,
    recording,
    busyId,
    showClear,
    busy,
    showSuggestions,
    canClear,
    init,
    reset,
    runAsk,
    sendText,
    confirmPending,
    cancelPending,
    botNote,
    clear,
  }
})
