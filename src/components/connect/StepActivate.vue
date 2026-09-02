<script setup lang="ts">
import { ref } from 'vue'
import { ExternalLink, MessageCircle } from '@lucide/vue'
import { useProfileStore } from '@/stores/profile'
import { isDemo, CALLMEBOT_ACTIVATE_URL, CALLMEBOT_NUMBER } from '@/lib/config'
import { validKey } from '@/lib/format'
import Spinner from '@/components/Spinner.vue'

const emit = defineEmits<{ next: []; back: [] }>()
const profile = useProfileStore()

const key = ref(profile.profile?.callmebot_key ?? '')
const error = ref<string | null>(null)
const busy = ref(false)

async function next() {
  error.value = validKey(key.value)
  if (error.value) return
  busy.value = true
  try {
    await profile.saveKey(key.value.trim())
    emit('next')
  } catch {
    error.value = 'Não consegui salvar. Tenta de novo?'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-[20px] font-extrabold text-ink">Libere o CallMeBot</h2>
    <p class="mt-1.5 text-[14px] leading-snug text-muted">
      Eu uso o CallMeBot, um serviço gratuito, pra mandar mensagem no seu WhatsApp. Ele só manda mensagem pra quem autorizar:
    </p>
    <ol class="mt-4 space-y-4 text-[14px] leading-snug text-ink-2">
      <li class="flex gap-3">
        <span class="num">1</span>
        <div class="flex-1">
          <p>Toque no botão abaixo. Vai abrir o WhatsApp com a mensagem pronta, é só enviar.</p>
          <a
            :href="CALLMEBOT_ACTIVATE_URL"
            target="_blank"
            rel="noopener"
            class="mt-2 inline-flex items-center gap-2 rounded-[12px] bg-primary-soft px-4 py-2.5 text-[14px] font-bold text-primary"
          >
            <MessageCircle :size="18" />
            Abrir o WhatsApp
            <ExternalLink :size="14" />
          </a>
        </div>
      </li>
      <li class="flex gap-3">
        <span class="num">2</span>
        <p class="flex-1">Em até 2 minutos o CallMeBot responde com a sua <b>API key</b> (um número).</p>
      </li>
      <li class="flex gap-3">
        <span class="num">3</span>
        <div class="flex-1">
          <p>Cole a API key aqui:</p>
          <input
            v-model="key"
            inputmode="numeric"
            autocomplete="off"
            placeholder="Ex.: 1234567"
            class="field mt-2"
            :class="error ? 'border-danger' : ''"
          />
          <p v-if="error" class="mt-1.5 text-[12.5px] font-semibold text-danger">{{ error }}</p>
          <p v-if="isDemo" class="mt-1.5 text-[12.5px] text-muted">Modo demo: qualquer número serve.</p>
        </div>
      </li>
    </ol>
    <p class="mt-4 text-[12.5px] leading-snug text-muted">
      Não abriu? Salve o número {{ CALLMEBOT_NUMBER }} nos contatos e mande a mensagem
      <i>I allow callmebot to send me messages</i>. Se a resposta demorar, o CallMeBot pede pra tentar de novo depois de 24h.
    </p>
    <button type="button" class="btn-primary mt-5 flex w-full items-center justify-center" :disabled="busy" @click="next">
      <Spinner v-if="busy" light :size="18" />
      <template v-else>Continuar</template>
    </button>
    <button type="button" class="mt-2 w-full py-2 text-[14px] font-bold text-muted" @click="emit('back')">Voltar</button>
  </div>
</template>
