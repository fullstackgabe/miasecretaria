<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'light' | 'dark' }>(), { tone: 'light' })
</script>

<template>
  <span>secretar<span :class="tone === 'light' ? 'text-accent' : 'text-primary'">IA</span></span>
</template>
