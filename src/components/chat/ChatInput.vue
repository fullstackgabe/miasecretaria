<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Mic, Square, ArrowUp } from '@lucide/vue'
import { useChatStore } from '@/stores/chat'
import { setChatInputFocused } from '@/composables/useInputFocus'
import { useRecorder } from '@/composables/useRecorder'
import RoundButton from './RoundButton.vue'

const chat = useChatStore()
const textarea = ref<HTMLTextAreaElement | null>(null)

const recorder = useRecorder((base64, mime, seconds) =>
  chat.runAsk({ audioBase64: base64, audioMime: mime }, '🎤 Mensagem de voz', seconds),
)
watch(recorder.recording, (v) => {
  chat.recording = v
})

const placeholder = computed(() => (chat.recording ? 'Gravando… toque em parar' : 'Fale com a secretarIA…'))
const canSend = computed(() => !!chat.draft.trim() && !chat.busy && !chat.recording)

function resize() {
  const el = textarea.value
  if (!el) return
  el.style.height = '38px'
  el.style.height = `${Math.min(120, Math.max(38, el.scrollHeight))}px`
}

watch(
  () => chat.draft,
  () => nextTick(resize),
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    chat.sendText()
  }
}

async function toggleMic() {
  if (chat.busy) return
  try {
    await recorder.toggle()
  } catch {
    chat.recording = false
    chat.botNote('Não consegui acessar o microfone. Verifique a permissão e tente de novo.')
  }
}

function focus() {
  textarea.value?.focus()
}

defineExpose({ focus })

onBeforeUnmount(() => setChatInputFocused(false))
</script>

<template>
  <div class="flex items-end gap-1.5 border-t border-line bg-white px-2.5 py-2">
    <textarea
      ref="textarea"
      v-model="chat.draft"
      rows="1"
      :readonly="chat.recording"
      :placeholder="placeholder"
      class="min-h-[38px] max-h-[120px] flex-1 resize-none rounded-[19px] border border-line bg-page px-3.5 py-2 text-base leading-5 text-ink placeholder:text-faint"
      @keydown="onKeydown"
      @focus="setChatInputFocused(true)"
      @blur="setChatInputFocused(false)"
      @input="resize"
    ></textarea>
    <RoundButton
      :disabled="chat.busy"
      :danger="chat.recording"
      :aria-label="chat.recording ? 'Parar gravação' : 'Gravar áudio'"
      @click="toggleMic"
    >
      <Square v-if="chat.recording" :size="17" fill="currentColor" />
      <Mic v-else :size="19" />
    </RoundButton>
    <button
      type="button"
      :disabled="!canSend"
      class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-white"
      :class="canSend ? 'bg-primary' : 'bg-primary-border'"
      aria-label="Enviar"
      @click="chat.sendText()"
    >
      <ArrowUp :size="19" />
    </button>
  </div>
</template>
