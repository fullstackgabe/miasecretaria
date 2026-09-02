<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, RefreshCw, Settings } from '@lucide/vue'
import Brand from '@/components/Brand.vue'
import { useAgendaStore } from '@/stores/agenda'

const route = useRoute()
const router = useRouter()
const agenda = useAgendaStore()
const isProfile = computed(() => route.path === '/perfil')
const isAgenda = computed(() => route.path === '/agenda')
const title = computed(() => String(route.meta.title ?? ''))
</script>

<template>
  <header class="shrink-0 bg-primary pt-[env(safe-area-inset-top)] text-white">
    <div class="relative flex h-14 items-center justify-center">
      <button
        v-if="isProfile"
        type="button"
        class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 active:bg-white/15"
        aria-label="Voltar"
        @click="router.push('/chat')"
      >
        <ArrowLeft :size="24" />
      </button>
      <h1 class="text-[17px] font-extrabold">
        <Brand v-if="route.meta.brand" />
        <template v-else>{{ title }}</template>
      </h1>
      <div v-if="!isProfile" class="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
        <button
          v-if="isAgenda"
          type="button"
          class="rounded-full p-2 active:bg-white/15"
          :class="agenda.loading ? 'animate-spin' : ''"
          aria-label="Atualizar"
          @click="agenda.load()"
        >
          <RefreshCw :size="22" />
        </button>
        <button type="button" class="rounded-full p-2 active:bg-white/15" aria-label="Perfil" @click="router.push('/perfil')">
          <Settings :size="24" />
        </button>
      </div>
    </div>
  </header>
</template>
