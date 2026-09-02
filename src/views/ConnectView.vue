<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import type { ConnectStep } from '@/types'
import Brand from '@/components/Brand.vue'
import Stepper from '@/components/connect/Stepper.vue'
import StepPhone from '@/components/connect/StepPhone.vue'
import StepActivate from '@/components/connect/StepActivate.vue'
import StepTest from '@/components/connect/StepTest.vue'

const route = useRoute()
const router = useRouter()
const profile = useProfileStore()

const redo = !!route.query.redo
const step = ref<ConnectStep>(redo ? 1 : profile.nextStep)

function done() {
  router.replace('/chat')
}
</script>

<template>
  <div class="flex flex-1 flex-col overflow-y-auto bg-page px-6 pb-8 pt-[calc(env(safe-area-inset-top)+28px)]">
    <div class="mx-auto w-full max-w-[380px]">
      <div class="mb-6 text-center text-[22px] font-extrabold text-ink"><Brand tone="dark" /></div>
      <Stepper :step="step" />
      <div class="rounded-[22px] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <StepPhone v-if="step === 1" @next="step = 2" />
        <StepActivate v-else-if="step === 2" @next="step = 3" @back="step = 1" />
        <StepTest v-else @done="done" @back="step = 2" />
      </div>
      <button
        v-if="redo && profile.verified"
        type="button"
        class="mt-4 w-full py-2 text-[14px] font-bold text-muted"
        @click="router.push('/perfil')"
      >
        Cancelar
      </button>
    </div>
  </div>
</template>
