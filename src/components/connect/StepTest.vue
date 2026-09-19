<script setup lang="ts">
import { ref } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { isDemo } from '@/lib/config'
import { toast } from '@/composables/useToast'
import Spinner from '@/components/Spinner.vue'

type State = 'idle' | 'sending' | 'sent' | 'notReceived' | 'invalid' | 'error'

const emit = defineEmits<{ done: []; back: [] }>()
const profile = useProfileStore()

const state = ref<State>('idle')
const busy = ref(false)

async function send() {
  state.value = 'sending'
  try {
    const r = await profile.sendTest()
    if (r.ok) {
      state.value = 'sent'
      if (isDemo) toast('📲 (simulado) ✅ Mia conectada!')
    } else if (r.status === 203) {
      state.value = 'invalid'
    } else {
      state.value = 'error'
    }
  } catch {
    state.value = 'error'
  }
}

async function confirm() {
  busy.value = true
  try {
    await profile.markVerified()
    emit('done')
  } catch {
    state.value = 'error'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-[20px] font-extrabold text-ink">Teste</h2>
    <p class="mt-1.5 text-[14px] leading-snug text-muted">Último passo: vou mandar uma mensagem de teste pro seu WhatsApp.</p>

    <template v-if="state === 'idle' || state === 'sending'">
      <button
        type="button"
        class="btn-primary mt-5 flex w-full items-center justify-center gap-2"
        :disabled="state === 'sending'"
        @click="send"
      >
        <template v-if="state === 'sending'"><Spinner light :size="18" /> Enviando…</template>
        <template v-else>Enviar mensagem de teste</template>
      </button>
    </template>

    <template v-else-if="state === 'sent'">
      <p class="mt-4 text-[15px] font-semibold text-ink">Mandei! Dá uma olhada no seu WhatsApp. 📲</p>
      <p class="mt-1 text-[13px] leading-snug text-muted">Pode demorar um pouco pra chegar, às vezes até 1 minuto.</p>
      <p class="mt-3 text-[14px] text-muted">Recebeu a mensagem?</p>
      <button type="button" class="btn-primary mt-3 flex w-full items-center justify-center" :disabled="busy" @click="confirm">
        <Spinner v-if="busy" light :size="18" />
        <template v-else>Sim, recebi ✅</template>
      </button>
      <button type="button" class="btn-secondary mt-2 w-full" @click="state = 'notReceived'">Não recebi</button>
    </template>

    <template v-else-if="state === 'notReceived'">
      <p class="mt-4 text-[14px] leading-snug text-muted">
        Confira se o número está certo, com DDD, e se a API key é a que o CallMeBot mandou.
      </p>
      <button type="button" class="btn-primary mt-4 w-full" @click="send">Enviar de novo</button>
      <button type="button" class="btn-secondary mt-2 w-full" @click="emit('back')">Voltar e corrigir</button>
    </template>

    <template v-else-if="state === 'invalid'">
      <p class="mt-4 text-[14px] font-semibold leading-snug text-danger">
        A API key parece inválida. Confira o número que o CallMeBot mandou e tente de novo.
      </p>
      <button type="button" class="btn-secondary mt-4 w-full" @click="emit('back')">Voltar</button>
    </template>

    <template v-else>
      <p class="mt-4 text-[14px] font-semibold leading-snug text-danger">
        Não consegui falar com o CallMeBot agora. Tenta de novo em instantes.
      </p>
      <button type="button" class="btn-primary mt-4 w-full" @click="send">Tentar de novo</button>
    </template>
  </div>
</template>
