<script setup lang="ts">
defineProps<{ modelValue: boolean; label?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();
</script>

<template>
  <button class="sw" :class="{ on: modelValue }" role="switch" :aria-checked="modelValue" @click="emit('update:modelValue', !modelValue)">
    <span v-if="label" class="sw-label">{{ label }}</span>
    <span class="sw-track"><i class="sw-dot" /></span>
  </button>
</template>

<style scoped>
.sw {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: var(--tw-mono);
}
.sw-label { color: #a9ffd2; font-size: 10.5px; letter-spacing: 0.08em; }
.sw-track {
  width: 30px;
  height: 16px;
  border-radius: 9px;
  background: rgba(110, 255, 180, 0.14);
  border: 1px solid rgba(110, 255, 180, 0.3);
  position: relative;
  transition: background 0.2s, border-color 0.2s;
  flex: none;
}
.sw-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3f8a67;
  transition: left 0.2s, background 0.2s, box-shadow 0.2s;
}
.sw.on .sw-track { background: rgba(90, 255, 160, 0.25); border-color: var(--tw-green-bright); }
.sw.on .sw-dot { left: 16px; background: var(--tw-green-bright); box-shadow: 0 0 8px rgba(90, 255, 160, 0.7); }
</style>
