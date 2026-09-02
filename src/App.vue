<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useChatStore } from '@/stores/chat'
import { useAgendaStore } from '@/stores/agenda'
import { chatInputFocused } from '@/composables/useInputFocus'
import AppHeader from '@/components/AppHeader.vue'
import TabBar from '@/components/TabBar.vue'
import Spinner from '@/components/Spinner.vue'
import Toast from '@/components/Toast.vue'
import LoginView from '@/views/LoginView.vue'
import PaywallView from '@/views/PaywallView.vue'

const auth = useAuthStore()
const profile = useProfileStore()
const chat = useChatStore()
const agenda = useAgendaStore()
const route = useRoute()
const router = useRouter()

onMounted(() => auth.init())

watch(
  () => auth.loggedIn,
  async (on) => {
    if (!on) {
      profile.reset()
      chat.reset()
      agenda.reset()
      return
    }
    if (!profile.ready) await profile.load()
    if (profile.subscribed === false) return
    if (!profile.verified && route.path !== '/conectar') router.replace('/conectar')
  },
)
</script>

<template>
  <div v-if="!auth.ready" class="flex flex-1 items-center justify-center bg-white">
    <Spinner />
  </div>
  <LoginView v-else-if="!auth.loggedIn" />
  <div v-else-if="!profile.ready" class="flex flex-1 items-center justify-center bg-white">
    <Spinner />
  </div>
  <PaywallView v-else-if="profile.subscribed === false" />
  <RouterView v-else-if="route.path === '/conectar'" v-slot="{ Component }">
    <component :is="Component" class="min-h-0 flex-1" />
  </RouterView>
  <template v-else>
    <AppHeader />
    <RouterView v-slot="{ Component }">
      <component :is="Component" class="min-h-0 flex-1" />
    </RouterView>
    <TabBar v-if="!chatInputFocused" />
  </template>
  <Toast />
</template>
