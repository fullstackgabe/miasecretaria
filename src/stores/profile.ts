import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as db from '@/lib/db'
import { deviceTz } from '@/lib/dates'
import type { ConnectStep, Profile, SendResult } from '@/types'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const ready = ref(false)
  const subscribed = ref<boolean | null>(null)

  const verified = computed(() => !!profile.value?.whatsapp_verified)

  const nextStep = computed<ConnectStep>(() => {
    if (!profile.value?.phone) return 1
    if (!profile.value?.callmebot_key) return 2
    return 3
  })

  async function load() {
    try {
      subscribed.value = await db.mySubscriptionActive()
    } catch {
      subscribed.value = true
    }
    if (!subscribed.value) {
      db.recordLead().catch(() => {})
      profile.value = null
      ready.value = true
      return
    }
    try {
      profile.value = await db.profileGet()
    } catch {
      profile.value = null
    } finally {
      ready.value = true
    }
  }

  async function savePhone(phone: string) {
    const changed = !!profile.value?.phone && profile.value.phone !== phone
    profile.value = await db.profileUpsert({
      phone,
      timezone: profile.value?.timezone || deviceTz(),
      ...(changed ? { callmebot_key: null, callmebot_phone: null, whatsapp_verified: false } : {}),
    })
  }

  async function saveKey(key: string) {
    const changed = profile.value?.callmebot_key !== key
    profile.value = await db.profileUpsert({
      callmebot_key: key,
      ...(changed ? { callmebot_phone: null, whatsapp_verified: false } : {}),
    })
  }

  async function markVerified() {
    profile.value = await db.profileUpsert({ whatsapp_verified: true })
  }

  async function saveTimezone(timezone: string) {
    profile.value = await db.profileUpsert({ timezone })
  }

  async function sendTest(): Promise<SendResult> {
    const r = await db.whatsappTest()
    if (r.ok) await load()
    return r
  }

  function reset() {
    profile.value = null
    ready.value = false
    subscribed.value = null
  }

  return { profile, ready, subscribed, verified, nextStep, load, savePhone, saveKey, markVerified, saveTimezone, sendTest, reset }
})
