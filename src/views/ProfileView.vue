<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { isDemo, TIMEZONES } from '@/lib/config'
import { phonePretty } from '@/lib/format'
import { deviceTz } from '@/lib/dates'
import { toast } from '@/composables/useToast'
import Spinner from '@/components/Spinner.vue'

const auth = useAuthStore()
const profile = useProfileStore()
const router = useRouter()

const testing = ref(false)
const tzOptions = Array.from(new Set([...TIMEZONES, deviceTz()]))
const initial = computed(() => (auth.user?.name || auth.user?.email || '?').slice(0, 1).toUpperCase())

async function sendTest() {
  testing.value = true
  try {
    const r = await profile.sendTest()
    if (r.ok) toast('Mensagem de teste enviada!')
    else if (r.status === 203) toast('A API key parece inválida. Toque em Reconectar.')
    else toast('Não consegui falar com o CallMeBot agora.')
  } catch {
    toast('Não consegui falar com o CallMeBot agora.')
  } finally {
    testing.value = false
  }
}

async function onTimezone(e: Event) {
  try {
    await profile.saveTimezone((e.target as HTMLSelectElement).value)
    toast('Fuso horário salvo.')
  } catch {
    toast('Não consegui salvar o fuso. Tenta de novo?')
  }
}
</script>

<template>
  <div class="flex-1 overflow-y-auto bg-page p-4">
    <p
      v-if="isDemo"
      class="mb-3 rounded-[12px] border border-warn-border bg-warn-soft px-3 py-2 text-[12.5px] font-semibold text-warn-text"
    >
      Modo demo: dados só neste navegador, WhatsApp simulado.
    </p>

    <section class="card">
      <h2 class="card-title">Conta</h2>
      <div class="flex items-center gap-3">
        <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="" class="h-12 w-12 rounded-full" referrerpolicy="no-referrer" />
        <div v-else class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-[18px] font-extrabold text-primary">
          {{ initial }}
        </div>
        <div class="min-w-0">
          <p class="truncate text-[15.5px] font-bold text-ink">{{ auth.user?.name }}</p>
          <p class="truncate text-[13px] text-muted">{{ auth.user?.email }}</p>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="card-title">WhatsApp</h2>
      <span class="pill" :class="profile.verified ? 'bg-success-soft text-success' : 'bg-warn-soft text-warn-text'">
        {{ profile.verified ? '✅ Conectado' : '⚠️ Não conectado' }}
      </span>
      <p class="mt-2 text-[15px] font-semibold text-ink">{{ phonePretty(profile.profile?.phone ?? null) || '—' }}</p>
      <div class="mt-3 flex gap-2">
        <button
          type="button"
          class="btn-secondary flex items-center justify-center gap-2"
          :disabled="testing || !profile.verified"
          @click="sendTest"
        >
          <Spinner v-if="testing" :size="16" />
          <template v-else>Enviar teste</template>
        </button>
        <button type="button" class="btn-primary" @click="router.push('/conectar?redo=1')">Reconectar</button>
      </div>
    </section>

    <section class="card">
      <h2 class="card-title">Fuso horário</h2>
      <select class="field" :value="profile.profile?.timezone" @change="onTimezone">
        <option v-for="tz in tzOptions" :key="tz" :value="tz">{{ tz }}</option>
      </select>
      <p class="mt-2 text-[12.5px] text-muted">Tudo que você marcar segue esse horário.</p>
    </section>

    <button
      type="button"
      class="btn-secondary mt-1 flex w-full items-center justify-center gap-2 !text-danger"
      @click="auth.signOut()"
    >
      <LogOut :size="18" />
      Sair
    </button>
  </div>
</template>
