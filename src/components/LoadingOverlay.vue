<script setup lang="ts">
import { useTwinStore } from '../composables/useTwinStore';

const store = useTwinStore();
</script>

<template>
  <transition name="fade">
    <div v-if="!store.ready" class="loader">
      <div class="l-inner">
        <div class="l-bar"><i /></div>
        <div>LOADING VOXEL SITE...</div>
        <div v-if="store.loadError" class="l-err">ERROR: {{ store.loadError }}</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: #0a0c10;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--tw-mono);
}
.l-inner { text-align: center; color: #6fe8a8; letter-spacing: 0.35em; font-size: 12px; }
.l-bar { width: 220px; height: 2px; background: rgba(110, 255, 180, 0.15); margin: 0 auto 16px; overflow: hidden; }
.l-bar i {
  display: block;
  height: 100%;
  width: 40%;
  background: #5affa0;
  animation: slide 1.1s infinite ease-in-out;
  box-shadow: 0 0 12px #5affa0;
}
@keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(560px); } }
.l-err { color: #ff7d6a; letter-spacing: 0.05em; font-size: 11px; margin-top: 14px; max-width: 80vw; }
.fade-leave-active { transition: opacity 0.7s ease; }
.fade-leave-to { opacity: 0; }
</style>
