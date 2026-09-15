<script setup lang="ts">
import { ref } from 'vue';
import { usePlaygroundScene } from './composables/usePlaygroundScene';
import TitleCard from './components/TitleCard.vue';
import TopStatusBar from './components/TopStatusBar.vue';
import PanelLeft from './components/PanelLeft.vue';
import PanelRight from './components/PanelRight.vue';
import BottomStrip from './components/BottomStrip.vue';
import LoadingOverlay from './components/LoadingOverlay.vue';

const container = ref<HTMLElement | null>(null);
usePlaygroundScene(container);
</script>

<template>
  <div class="stage">
    <div ref="container" class="canvas-host" />
    <TitleCard />
    <TopStatusBar />
    <PanelLeft />
    <PanelRight />
    <BottomStrip />
    <LoadingOverlay />
  </div>
</template>

<style scoped>
.stage {
  position: fixed;
  inset: 0;
  background: #0b0d12;
}
.canvas-host {
  position: absolute;
  inset: 0;
}
</style>
