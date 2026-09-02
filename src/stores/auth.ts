import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isDemo } from '@/lib/config'
import { demoAuth } from '@/lib/demoAuth'
import type { AuthUser } from '@/types'

const LOGIN_ERROR = 'Não foi possível entrar com o Google. Tente de novo.'

const DEMO_USER: AuthUser = { name: 'Demo', email: 'demo@demo.com', avatar: null }

function userOf(session: Session | null): AuthUser | null {
  const u = session?.user
  if (!u) return null
  const meta = (u.user_metadata || {}) as Record<string, unknown>
  const name = String(meta.full_name || meta.name || u.email?.split('@')[0] || '')
  return { name, email: u.email || '', avatar: typeof meta.avatar_url === 'string' ? meta.avatar_url : null }
}

export const useAuthStore = defineStore('auth', () => {
  const loggedIn = ref(false)
  const ready = ref(false)
  const busy = ref(false)
  const error = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)
  let started = false

  function cleanUrl() {
    const { hash, search, pathname } = window.location
    if (hash.includes('access_token') || hash.includes('error') || search.includes('code=')) {
      window.history.replaceState(null, '', pathname)
    }
  }

  async function init() {
    if (started) return
    started = true
    if (isDemo) {
      loggedIn.value = await demoAuth.getSession()
      user.value = loggedIn.value ? DEMO_USER : null
      demoAuth.subscribe((on) => {
        loggedIn.value = on
        user.value = on ? DEMO_USER : null
      })
      ready.value = true
      return
    }
    const { data } = await supabase.auth.getSession()
    loggedIn.value = !!data.session
    user.value = userOf(data.session)
    ready.value = true
    cleanUrl()
    supabase.auth.onAuthStateChange((_event, session) => {
      loggedIn.value = !!session
      user.value = userOf(session)
      busy.value = false
      cleanUrl()
    })
  }

  async function signInGoogle() {
    busy.value = true
    error.value = null
    try {
      const { error: e } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (e) throw e
    } catch {
      error.value = LOGIN_ERROR
      busy.value = false
    }
  }

  async function signInDemo() {
    await demoAuth.signIn()
  }

  async function signOut() {
    if (isDemo) await demoAuth.signOut()
    else await supabase.auth.signOut()
  }

  return { loggedIn, ready, busy, error, user, isDemo, init, signInGoogle, signInDemo, signOut }
})
