<script setup lang="ts">
import { LogOut, Sparkles } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { SUBSCRIBE_URL } from '@/lib/config'
import Brand from '@/components/Brand.vue'

const auth = useAuthStore()

const PRESENTATION =
  'Oi, eu sou a secretarIA 👋\n\n' +
  'Ainda não sou a sua secretária... mas adoraria ser! 😄\n\n' +
  'Marco seus compromissos por texto ou áudio e te lembro no WhatsApp na hora certa.\n\n' +
  'Pra me ter de vez, é só falar com a gente e ativar o seu acesso. É baratinho e super vale a pena! 👇'

const FAREWELL = 'Te vejo em breve! 😊'
</script>

<template>
  <div class="flex flex-1 flex-col overflow-y-auto bg-page px-6 pb-8 pt-[calc(env(safe-area-inset-top)+28px)]">
    <div class="mx-auto flex w-full max-w-[380px] flex-1 flex-col">
      <div class="mb-5 flex flex-col items-center">
        <div class="mb-3 flex h-[64px] w-[64px] items-center justify-center rounded-[20px] bg-primary-soft">
          <span class="text-[32px] leading-none">🗓️</span>
        </div>
        <h1 class="text-[24px] font-extrabold text-ink"><Brand tone="dark" /></h1>
      </div>

      <div class="rounded-[22px] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <p class="whitespace-pre-line text-[15px] leading-[22px] text-ink">{{ PRESENTATION }}</p>
        <a
          :href="SUBSCRIBE_URL"
          target="_blank"
          rel="noopener"
          class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[15px] font-extrabold text-white"
        >
          <Sparkles :size="17" />
          Quero a secretarIA
        </a>
        <p class="mt-4 text-[15px] leading-[22px] text-ink">{{ FAREWELL }}</p>
      </div>

      <p class="mt-5 text-center text-[12.5px] text-muted">
        Você entrou como <b class="text-ink-2">{{ auth.user?.email }}</b>.<br />
        Se assinou com outro e-mail, saia e entre de novo.
      </p>
      <button
        type="button"
        class="mx-auto mt-2 flex items-center gap-1.5 py-2 text-[13.5px] font-bold text-muted"
        @click="auth.signOut()"
      >
        <LogOut :size="15" />
        Sair
      </button>
    </div>
  </div>
</template>
