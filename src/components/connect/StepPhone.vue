<script setup lang="ts">
import { ref } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { splitE164, toE164, validPhone } from '@/lib/format'
import PhoneInput from '@/components/connect/PhoneInput.vue'
import Spinner from '@/components/Spinner.vue'

const emit = defineEmits<{ next: [] }>()
const profile = useProfileStore()

const init = splitE164(profile.profile?.phone ?? null)
const ddi = ref(init.ddi || '55')
const local = ref(init.local)
const error = ref<string | null>(null)
const busy = ref(false)

async function next() {
  error.value = validPhone(ddi.value, local.value)
  if (error.value) return
  busy.value = true
  try {
    await profile.savePhone(toE164(ddi.value, local.value))
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
    <h2 class="text-[20px] font-extrabold text-ink">Vamos conectar seu WhatsApp</h2>
    <p class="mt-1.5 text-[14px] leading-snug text-muted">
      É por lá que eu te aviso dos compromissos. Leva 2 minutinhos e só precisa fazer uma vez.
    </p>
    <label class="label">Seu número do WhatsApp</label>
    <PhoneInput v-model:ddi="ddi" v-model:local="local" :error="error" />
    <button type="button" class="btn-primary mt-5 flex w-full items-center justify-center" :disabled="busy" @click="next">
      <Spinner v-if="busy" light :size="18" />
      <template v-else>Continuar</template>
    </button>
  </div>
</template>
