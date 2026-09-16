<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useTwinStore } from '../composables/useTwinStore';
import { useWeather } from '../composables/useWeather';
import { useDayNight } from '../composables/useDayNight';
import { WEATHER_TEXT } from '../data/types';
import { twinsBridge } from '../scene/twin/twinsBridge';
import ToggleSwitch from './ToggleSwitch.vue';
import type { TwinEntityState } from '../data/types';

const store = useTwinStore();
const weather = useWeather();
const day = useDayNight();

const MACHINE_IDS = ['crane-1', 'crane-2', 'dig-1', 'dig-2', 'truck-1', 'truck-2', 'truck-3', 'mixer-1', 'loader-1'];
const IDLE_LABELS = new Set(['行驶中', '避让停车', '待机']);

interface MachineRow {
  id: string;
  name: string;
  state: string;
  progress: number | null;
  busy: boolean;
}

const machines = ref<MachineRow[]>([]);
const machineTotal = MACHINE_IDS.length;
let timer = 0;
const tick = (): void => {
  const twins = twinsBridge.twins;
  if (!twins) return;
  machines.value = MACHINE_IDS.map((id) => {
    const st: TwinEntityState | null = twins.getState(id);
    const label = st?.label ?? '—';
    return {
      id,
      name: twins.getName(id),
      state: label,
      progress: twins.getProgress(id),
      busy: !IDLE_LABELS.has(label),
    };
  });
};
timer = window.setInterval(tick, 900);
tick();
onUnmounted(() => window.clearInterval(timer));

const views = computed(() => store.config.views);
const layers = computed(() => [
  { key: 'tower' as const, name: '塔吊' },
  { key: 'excavator' as const, name: '挖掘机' },
  { key: 'vehicle' as const, name: '运输车辆' },
  { key: 'worker' as const, name: '作业工人' },
  { key: 'dust' as const, name: '尘土粒子' },
  { key: 'flag' as const, name: '彩旗标识' },
]);
const zoneDefs = computed(() => store.entityDefs.filter((e) => e.type === 'zone' || e.type === 'workerGroup'));

function applyView(id: string): void {
  twinsBridge.actions?.applyView(id);
}
function resetView(): void {
  twinsBridge.actions?.resetView();
  store.selectionId = null;
}
function select(id: string): void {
  store.selectionId = store.selectionId === id ? null : id;
}
function triggerRain(): void {
  weather.setWeather(store.weather === 'rain' ? 'clear' : 'rain');
}
</script>

<template>
  <div class="tw-panel left-panel">
    <!-- 视角预设 -->
    <div class="sec-head">
      <span>视角预设</span><i>{{ views.length }} 组</i>
    </div>
    <div class="view-grid">
      <button
        v-for="v in views"
        :key="v.id"
        class="chip"
        @click="applyView(v.id)"
      >{{ v.name }}</button>
      <button class="chip ghost" @click="resetView">复位视角</button>
    </div>

    <!-- 图层开关 -->
    <div class="sec-head">
      <span>图层开关</span><i>可见性</i>
    </div>
    <div class="layer-list">
      <div v-for="l in layers" :key="l.key" class="layer-row">
        <span>{{ l.name }}</span>
        <ToggleSwitch v-model="store.layers[l.key]" />
      </div>
    </div>

    <!-- 系统开关 -->
    <div class="sec-head">
      <span>系统开关</span><i>场景行为</i>
    </div>
    <div class="layer-row">
      <span>相机自动环绕</span>
      <ToggleSwitch v-model="store.autoOrbit" />
    </div>

    <!-- 一天的时间 -->
    <div class="sec-head">
      <span>一天的时间</span>
      <button class="chip" :class="{ active: store.autoTime }" @click="day.autoTime.value = !day.autoTime.value">
        {{ store.autoTime ? '自动流逝' : '已暂停' }}
      </button>
    </div>
    <input v-model.number="day.hour.value" class="tw-slider" type="range" min="0" max="24" step="0.25" />
    <div class="time-row">

    </div>
    <div class="view-grid">
      <button
        v-for="p in day.presets"
        :key="p.en"
        class="chip"
        :class="{ active: Math.abs(day.hour.value - p.hour) < 0.13 }"
        @click="day.applyPreset(p)"
      >{{ p.label }}</button>
    </div>

    <!-- 天气 -->
    <div class="sec-head">
      <span>天气控制</span><i>{{ WEATHER_TEXT[store.weather].en }}</i>
    </div>
    <div class="view-grid">
      <button class="chip" :class="{ active: weather.weather.value === 'clear' }" @click="weather.setWeather('clear')">晴 CLEAR</button>
      <button class="chip" :class="{ active: weather.isRain.value }" @click="weather.setWeather('rain')">暴雨 RAIN</button>
      <button class="chip" :class="{ active: weather.isSnow.value }" @click="weather.setWeather('snow')">降雪 SNOW</button>
    </div>

    <!-- 实体索引 -->
    <div class="sec-head">
      <span>实体索引</span><i>{{ zoneDefs.length }} 项</i>
    </div>
    <div class="view-grid">
      <button
        v-for="e in zoneDefs"
        :key="e.id"
        class="chip"
        :class="{ active: store.selectionId === e.id }"
        @click="select(e.id)"
      >{{ e.name }}</button>
    </div>
  </div>
</template>

<style scoped>
.left-panel {
  top: 76px;
  left: 14px;
  width: 236px;
  bottom: 96px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(110, 255, 180, 0.3) transparent;
}
.left-panel::-webkit-scrollbar { width: 5px; }
.left-panel::-webkit-scrollbar-thumb { background: rgba(110, 255, 180, 0.3); border-radius: 3px; }

.sec-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  color: #c8ffe2;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 14px 0 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(110, 255, 180, 0.14);
}
.sec-head:first-of-type { margin-top: 2px; padding-top: 0; border-top: none; }
.sec-head i { font-style: normal; color: #3f8a67; font-size: 9px; letter-spacing: 0.1em; }

.view-grid { display: flex; flex-wrap: wrap; gap: 5px; }
.chip {
  font-family: var(--tw-mono);
  font-size: 10px;
  color: #a9ffd2;
  background: rgba(20, 46, 34, 0.45);
  border: 1px solid rgba(110, 255, 180, 0.22);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  letter-spacing: 0.08em;
}
.chip:hover { background: rgba(40, 90, 66, 0.55); }
.chip.active {
  background: rgba(90, 255, 160, 0.16);
  border-color: var(--tw-green-bright);
  color: #eafff4;
  box-shadow: 0 0 8px rgba(90, 255, 160, 0.3);
}
.chip.ghost { color: #7fcfa6; border-style: dashed; }

.layer-list { display: flex; flex-direction: column; gap: 7px; }
.layer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #a9ffd2;
  font-size: 10.5px;
  letter-spacing: 0.08em;
}

.action-btn {
  width: 100%;
  margin-top: 10px;
  font-family: var(--tw-mono);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  color: #0d2018;
  background: linear-gradient(180deg, #7dffb0, #45d98a);
  border: none;
  border-radius: 7px;
  padding: 7px 0;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 0 14px rgba(90, 255, 160, 0.25);
}
.action-btn.rain {
  color: #eafff4;
  background: linear-gradient(180deg, #4aa3d8, #2b6f9e);
  box-shadow: 0 0 14px rgba(90, 180, 255, 0.25);
}

.time-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.time-row b { color: #c8ffe2; font-size: 13px; letter-spacing: 0.15em; }

.dev-list { display: flex; flex-direction: column; gap: 3px; }
.dev-row {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  grid-template-rows: auto 3px;
  column-gap: 7px;
  align-items: center;
  width: 100%;
  text-align: left;
  background: rgba(20, 46, 34, 0.3);
  border: 1px solid rgba(110, 255, 180, 0.14);
  border-radius: 6px;
  padding: 5px 8px;
  cursor: pointer;
  font-family: var(--tw-mono);
}
.dev-row:hover { background: rgba(40, 90, 66, 0.45); }
.dev-row.sel { border-color: var(--tw-green-bright); background: rgba(90, 255, 160, 0.12); }
.dot { width: 6px; height: 6px; border-radius: 50%; }
.dot.busy { background: #ffb84d; box-shadow: 0 0 6px rgba(255, 184, 77, 0.8); }
.dot.idle { background: #4dff96; box-shadow: 0 0 6px rgba(77, 255, 150, 0.7); }
.dev-name { color: #c8ffe2; font-size: 10.5px; }
.dev-state { font-style: normal; color: #6fc79b; font-size: 9px; grid-column: 2 / 4; }
.dev-bar {
  grid-column: 1 / 4;
  height: 3px;
  border-radius: 2px;
  background: rgba(110, 255, 180, 0.12);
  overflow: hidden;
  margin-top: 3px;
}
.dev-bar i { display: block; height: 100%; background: var(--tw-green-bright); box-shadow: 0 0 6px rgba(90, 255, 160, 0.6); }
</style>
