<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useTwinStore, speedMult } from '../composables/useTwinStore';
import { WEATHER_TEXT } from '../data/types';
import { twinsBridge } from '../scene/twin/twinsBridge';

const store = useTwinStore();

const MACHINE_IDS = ['crane-1', 'crane-2', 'dig-1', 'dig-2', 'truck-1', 'truck-2', 'truck-3', 'mixer-1', 'loader-1'];
const IDLE_LABELS = new Set(['行驶中', '待机', '避让停车']);

const working = ref(0);
const walking = ref(0);
let timer = 0;

const tick = (): void => {
  const twins = twinsBridge.twins;
  if (!twins) return;
  working.value = MACHINE_IDS.filter((id) => {
    const st = twins.getState(id);
    return st ? !IDLE_LABELS.has(st.label) : false;
  }).length;
  const ws = twinsBridge.workers;
  walking.value = ws ? ws.workers.filter((w) => w.mode === 'walk').length : 0;
};
timer = window.setInterval(tick, 800);
tick();
onUnmounted(() => window.clearInterval(timer));

const mode = computed(() => {
  if (store.weather === 'rain') return '雨天作业';
  if (store.weather === 'snow') return '雪天作业';
  const t = store.timeOfDay;
  if (t >= 19 || t < 6) return '夜间施工';
  return '施工进行中';
});

const cols = computed(() => [
  { k: '运行模式', v: mode.value, accent: true },
  { k: '昼夜时钟', v: store.clockText },
  { k: '天气', v: WEATHER_TEXT[store.weather].cn },
  { k: '仿真速度', v: `${speedMult(store).toFixed(1)}×` },
  { k: '作业机械', v: `${working.value} / ${MACHINE_IDS.length} 台` },
  { k: '流动巡查', v: `${walking.value} 人` },
]);
</script>

<template>
  <div class="tw-panel strip">
    <div v-for="c in cols" :key="c.k" class="col">
      <span class="k">{{ c.k }}</span>
      <b class="v" :class="{ accent: c.accent }">{{ c.v }}</b>
    </div>
  </div>
</template>

<style scoped>
.strip {
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0;
  padding: 8px 6px;
  border-radius: 12px;
}
.col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 18px;
  border-right: 1px solid rgba(110, 255, 180, 0.15);
}
.col:last-child { border-right: none; }
.k { color: #4f9e78; font-size: 9px; letter-spacing: 0.14em; }
.v { color: #c8ffe2; font-size: 12.5px; font-weight: 700; letter-spacing: 0.08em; }
.v.accent {
  color: var(--tw-green-bright);
  text-shadow: 0 0 10px rgba(90, 255, 160, 0.55);
}
@media (max-width: 1100px) {
  .strip { width: calc(100% - 28px); flex-wrap: wrap; justify-content: center; }
  .col { padding: 4px 12px; }
}
</style>
