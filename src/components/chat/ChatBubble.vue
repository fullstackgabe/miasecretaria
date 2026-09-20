<script setup lang="ts">
import { computed } from 'vue'
import { CheckCheck } from '@lucide/vue'
import type { ChatItem, ParsedAppointment } from '@/types'
import { timeOf } from '@/lib/format'
import AppointmentCard from './AppointmentCard.vue'
import VoiceWave from './VoiceWave.vue'

const props = defineProps<{ msg: ChatItem; busy: boolean; tz: string }>()
const emit = defineEmits<{ confirm: [id: string, appointment: ParsedAppointment]; cancel: [id: string] }>()

const isUser = computed(() => props.msg.role === 'user')
const pending = computed(() => (props.msg.meta?.type === 'pending' ? props.msg.meta : null))
const registered = computed(() => (props.msg.meta?.type === 'appointment' ? props.msg.meta : null))
const hasCard = computed(() => !!pending.value || !!registered.value)
const time = computed(() => timeOf(props.msg))
const showText = computed(() => !hasCard.value && props.msg.voiceDuration == null)

function confirm() {
  if (pending.value) emit('confirm', props.msg.id, pending.value.appointment)
}
</script>

<template>
  <div class="mb-[7px] flex flex-col" :class="isUser ? 'items-end' : 'items-start'">
    <div
      class="relative rounded-2xl px-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
      :class="[
        hasCard ? 'max-w-[90%] py-3' : 'max-w-[82%] py-[7px]',
        isUser ? 'rounded-br-[4px] bg-primary text-white' : 'rounded-bl-[4px] border border-line bg-white text-ink',
      ]"
    >
      <VoiceWave v-if="msg.voiceDuration != null" :is-user="isUser" :seconds="msg.voiceDuration" :time="time" />

      <AppointmentCard
        v-if="pending"
        :pending="pending.appointment"
        :conflict="pending.conflict"
        :tz="tz"
      />
      <AppointmentCard v-else-if="registered" :appointment="registered.appointment" :reminder="registered.reminder" :tz="tz" />

      <p v-else-if="showText" class="whitespace-pre-line text-[15px] leading-[21px]" :class="isUser ? 'text-white' : 'text-ink'">{{ msg.content }}<span class="inline-block" :class="isUser ? 'w-[52px]' : 'w-[36px]'"></span></p>

      <div v-if="time && showText" class="absolute bottom-[5px] right-[10px] flex items-center gap-[3px]">
        <span class="text-[10.5px]" :class="isUser ? 'text-white/70' : 'text-faint'">{{ time }}</span>
        <CheckCheck v-if="isUser" :size="13" class="text-[#53bdeb]" />
      </div>
    </div>

    <div v-if="pending" class="mt-2 flex gap-2">
      <button
        type="button"
        :disabled="busy"
        class="rounded-xl border border-line bg-white px-[18px] py-2.5 text-[13px] font-bold text-ink-3"
        @click="emit('cancel', msg.id)"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="busy"
        class="rounded-xl bg-primary px-[18px] py-2.5 text-[13px] font-extrabold text-white"
        :class="busy ? 'opacity-60' : ''"
        @click="confirm"
      >
        {{ busy ? 'Marcando…' : 'Confirmar' }}
      </button>
    </div>
  </div>
</template>
