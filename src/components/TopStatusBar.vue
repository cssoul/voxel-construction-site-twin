<script setup lang="ts">
import { computed } from 'vue';
import { useTwinStore } from '../composables/useTwinStore';
import { WEATHER_TEXT } from '../data/types';

const store = useTwinStore();

const clockSec = computed(() => {
  const t = store.timeOfDay;
  const s = Math.floor((t * 3600) % 60);
  const m = Math.floor((t * 60) % 60);
  const h = Math.floor(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
});

const pills = computed(() => [
  { k: 'clock', v: clockSec.value },
  { k: 'weather', v: `${WEATHER_TEXT[store.weather].cn} ${WEATHER_TEXT[store.weather].en}` },
  { k: 'dust', v: `尘土 ${['LOW', 'MED', 'HIGH'][store.dustIdx]}` },
  { k: 'speed', v: `${store.config.presets.speed[store.speedIdx].toFixed(1)}×` },
  { k: 'sel', v: store.selectionId ? (store.entityDefs.find((e) => e.id === store.selectionId)?.name ?? '实体') : '未选中' },
  { k: 'fps', v: `${store.fps || '--'} FPS` },
]);
</script>

<template>
  <div class="tw-panel pill-bar">
    <span v-for="p in pills" :key="p.k" class="pill" :class="{ accent: p.k === 'clock' || p.k === 'fps' }">
      {{ p.v }}
    </span>
  </div>
</template>

<style scoped>
.pill-bar {
  top: 14px;
  right: 14px;
  display: flex;
  gap: 6px;
  padding: 6px;
  border-radius: 999px;
}
.pill {
  font-size: 10px;
  color: #a9ffd2;
  background: rgba(20, 46, 34, 0.5);
  border: 1px solid rgba(110, 255, 180, 0.2);
  border-radius: 999px;
  padding: 4px 12px;
  letter-spacing: 0.1em;
  white-space: nowrap;
}
.pill.accent {
  color: #eafff4;
  border-color: rgba(90, 255, 160, 0.5);
  background: rgba(90, 255, 160, 0.12);
  text-shadow: 0 0 8px rgba(90, 255, 160, 0.5);
}
@media (max-width: 1280px) {
  .pill-bar { flex-wrap: wrap; border-radius: 14px; justify-content: flex-end; max-width: 420px; }
}
</style>
