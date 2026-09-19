import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import ChatView from '@/views/ChatView.vue'
import AgendaView from '@/views/AgendaView.vue'
import ProfileView from '@/views/ProfileView.vue'
import ConnectView from '@/views/ConnectView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/chat' },
    { path: '/chat', name: 'chat', component: ChatView, meta: { title: 'Mia', brand: true } },
    { path: '/agenda', name: 'agenda', component: AgendaView, meta: { title: 'Agenda' } },
    { path: '/perfil', name: 'perfil', component: ProfileView, meta: { title: 'Perfil' } },
    { path: '/conectar', name: 'conectar', component: ConnectView, meta: { title: 'Conectar' } },
    { path: '/:pathMatch(.*)*', redirect: '/chat' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready || !auth.loggedIn) return true
  const profile = useProfileStore()
  if (!profile.ready) await profile.load()
  if (profile.subscribed === false) return true
  if (!profile.verified && to.path !== '/conectar') return '/conectar'
  if (profile.verified && to.path === '/conectar' && !to.query.redo) return '/chat'
  return true
})
