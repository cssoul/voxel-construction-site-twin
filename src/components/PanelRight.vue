<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { useTwinStore } from '../composables/useTwinStore';
import { twinsBridge } from '../scene/twin/twinsBridge';
import type { TwinEntityState } from '../data/types';

const store = useTwinStore();
type Tab = 'overview' | 'entity';
const tab = ref<Tab>('overview');

watch(
  () => store.selectionId,
  (id) => {
    if (id) tab.value = 'entity';
  },
);

function goOverview(): void {
  tab.value = 'overview';
  store.selectionId = null;
  twinsBridge.actions?.applyView('overview');
}
function resetView(): void {
  twinsBridge.actions?.resetView();
}

// —— 总览数据（0.8Hz 轮询实时状态）——
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
const working = ref(0);
const driving = ref(0);
const walking = ref(0);
const workingWorkers = computed(() => store.config.workerCount - walking.value);

let timer = 0;
const tmp = new THREE.Vector3();
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
  working.value = machines.value.filter((m) => m.busy).length;
  driving.value = machines.value.filter((m) => m.state === '行驶中').length;
  const ws = twinsBridge.workers;
  walking.value = ws ? ws.workers.filter((w) => w.mode === 'walk').length : 0;
};
timer = window.setInterval(tick, 800);
tick();
onUnmounted(() => window.clearInterval(timer));

const tiles = computed(() => [
  { k: '作业机械', v: `${working.value}`, u: `/ ${machines.value.length} 台` },
  { k: '转运车辆', v: `${driving.value}`, u: '/ 5 台' },
  { k: '作业工人', v: `${workingWorkers.value}`, u: `/${store.config.workerCount} 人` },
  { k: '塔吊', v: '2', u: '台' },
]);

const bars = computed(() => {
  const total = Math.max(1, machines.value.length);
  return [
    { k: '作业机械', v: working.value, max: total, unit: '台' },
    { k: '转运车辆', v: driving.value, max: 5, unit: '台' },
    { k: '作业工人', v: workingWorkers.value, max: store.config.workerCount, unit: '人' },
    { k: '流动巡查', v: walking.value, max: store.config.workerCount, unit: '人' },
  ];
});

// —— 实体详情 ——
const state = ref<TwinEntityState | null>(null);
const name = ref('');
const pos = ref<[number, number, number] | null>(null);
let detailTimer = 0;
const tickDetail = (): void => {
  const id = store.selectionId;
  const twins = twinsBridge.twins;
  if (!id || !twins || !twins.has(id)) {
    state.value = null;
    name.value = '';
    pos.value = null;
    return;
  }
  name.value = twins.getName(id);
  state.value = twins.getState(id);
  const p = twins.getPos(id, tmp);
  pos.value = p ? [p.x, p.y, p.z] : null;
};
detailTimer = window.setInterval(tickDetail, 250);
onUnmounted(() => window.clearInterval(detailTimer));

const def = computed(() => store.entityDefs.find((e) => e.id === store.selectionId) ?? null);
const typeLabel = computed(() => {
  const map: Record<string, string> = {
    crane: '塔吊', excavator: '挖掘机', truck: '渣土车', mixer: '搅拌车', loader: '装载机',
    worker: '工人', workerGroup: '工人班组', zone: '功能分区',
  };
  return map[def.value?.type ?? ''] ?? '实体';
});
</script>

<template>
  <div class="tw-panel right-panel">
    <!-- Tab 头 -->
    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'overview' }" @click="tab = 'overview'">全局总览</button>
      <button class="tab" :class="{ active: tab === 'entity' }" @click="tab = 'entity'">实体详情</button>
      <button class="mini" title="复位视角" @click="resetView">复位视角</button>
    </div>

    <!-- 全局总览 -->
    <div v-show="tab === 'overview'" class="tw-scroll body">
      <div class="headline">
        <div class="en">SITE OVERVIEW</div>
        <div class="cn">工地运行总览</div>
        <p>点击场景中的塔吊 / 机械 / 工人，或使用左侧实体按钮查看实时详情</p>
      </div>

      <div class="tiles">
        <div v-for="t in tiles" :key="t.k" class="tile">
          <span>{{ t.k }}</span>
          <b>{{ t.v }}<i>{{ t.u }}</i></b>
        </div>
      </div>

      <div class="sec-title">
        <span>实时工况构成</span><i>LIVE</i>
      </div>
      <div class="bars">
        <div v-for="b in bars" :key="b.k" class="bar-row">
          <span class="bk">{{ b.k }}</span>
          <span class="btrack"><i :style="{ width: `${Math.round((b.v / b.max) * 100)}%` }" /></span>
          <b class="bv">{{ b.v }} <i>{{ b.unit }}</i></b>
        </div>
      </div>

      <div class="sec-title">
        <span>机械运行状态</span><i>{{ machines.length }} 台</i>
      </div>
      <div class="dev-list">
        <button
          v-for="m in machines"
          :key="m.id"
          class="dev-row"
          :class="{ sel: store.selectionId === m.id }"
          @click="store.selectionId = store.selectionId === m.id ? null : m.id"
        >
          <i class="dot" :class="m.busy ? 'busy' : 'idle'" />
          <span class="dev-name">{{ m.name }}</span>
          <em class="dev-state">{{ m.state }}</em>
          <span class="dev-pct">{{ Math.round((m.progress ?? 0) * 100) }}%</span>
          <span class="dev-bar"><i :style="{ width: `${Math.round((m.progress ?? 0) * 100)}%` }" /></span>
        </button>
      </div>
    </div>

    <!-- 实体详情 -->
    <div v-show="tab === 'entity'" class="body">
      <template v-if="store.selectionId && (state || def)">
        <div class="headline">
          <div class="en">{{ def?.en || typeLabel }}</div>
          <div class="cn">{{ name || def?.name }}</div>
          <p>{{ def?.desc || '场景实时实体' }}</p>
        </div>
        <div class="status-box">
          <span>STATUS</span>
          <b>{{ state?.label ?? '—' }}</b>
        </div>
        <div class="kv">
          <template v-for="d in state?.details ?? []" :key="d.k">
            <span>{{ d.k }}</span><b>{{ d.v }}</b>
          </template>
          <template v-if="pos">
            <span>坐标</span><b>{{ pos[0].toFixed(1) }}, {{ pos[2].toFixed(1) }}</b>
          </template>
        </div>
        <button class="close-btn" @click="store.selectionId = null">关闭详情 CLOSE</button>
      </template>
      <div v-else class="empty">
        未选中实体。<br />点击场景元素或左侧列表。
      </div>
    </div>
  </div>
</template>

<style scoped>
.right-panel {
  top: 66px;
  right: 14px;
  width: 262px;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
}
.tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
}
.tab {
  flex: 1;
  font-family: var(--tw-mono);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  color: #7fcfa6;
  background: rgba(20, 46, 34, 0.4);
  border: 1px solid rgba(110, 255, 180, 0.2);
  border-radius: 7px;
  padding: 5px 0;
  cursor: pointer;
}
.tab.active {
  color: #0d2018;
  font-weight: 700;
  background: linear-gradient(180deg, #7dffb0, #45d98a);
  border-color: transparent;
  box-shadow: 0 0 12px rgba(90, 255, 160, 0.35);
}
.mini {
  font-family: var(--tw-mono);
  font-size: 9.5px;
  color: #4f9e78;
  background: none;
  border: 1px dashed rgba(110, 255, 180, 0.3);
  border-radius: 7px;
  padding: 5px 8px;
  cursor: pointer;
}
.mini:hover { color: #a9ffd2; }
.body { overflow-y: auto; min-height: 0; }

.headline .en { color: #3f8a67; font-size: 9px; letter-spacing: 0.2em; }
.headline .cn { color: #eafff4; font-size: 14px; font-weight: 700; letter-spacing: 0.14em; margin: 2px 0 4px; }
.headline p { color: #57b98a; font-size: 9.5px; line-height: 1.6; margin: 0; }

.tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin: 12px 0;
}
.tile {
  border: 1px solid rgba(110, 255, 180, 0.16);
  background: rgba(20, 46, 34, 0.32);
  border-radius: 8px;
  padding: 7px 9px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.tile span { color: #4f9e78; font-size: 9px; letter-spacing: 0.12em; }
.tile b { color: #eafff4; font-size: 15px; letter-spacing: 0.06em; }
.tile b i { font-style: normal; color: #3f8a67; font-size: 9px; margin-left: 3px; }

.sec-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  color: #c8ffe2;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 12px 0 8px;
}
.sec-title i { font-style: normal; color: #5affa0; font-size: 9px; }

.bar-row {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;
}
.bk { color: #4f9e78; font-size: 10px; }
.btrack { height: 5px; border-radius: 3px; background: rgba(110, 255, 180, 0.12); overflow: hidden; }
.btrack i { display: block; height: 100%; border-radius: 3px; background: linear-gradient(90deg, #45d98a, #a9ffd2); box-shadow: 0 0 8px rgba(90, 255, 160, 0.5); transition: width 0.4s; }
.bv { color: #c8ffe2; font-size: 10.5px; }
.bv i { font-style: normal; color: #3f8a67; font-size: 9px; }

.dev-list { display: flex; flex-direction: column; gap: 3px; }
.dev-row {
  display: grid;
  grid-template-columns: 10px 1fr auto auto;
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
.dev-state { font-style: normal; color: #6fc79b; font-size: 9px; }
.dev-pct { color: #a9ffd2; font-size: 10px; }
.dev-bar {
  grid-column: 1 / 5;
  height: 3px;
  border-radius: 2px;
  background: rgba(110, 255, 180, 0.12);
  overflow: hidden;
  margin-top: 3px;
}
.dev-bar i { display: block; height: 100%; background: var(--tw-green-bright); box-shadow: 0 0 6px rgba(90, 255, 160, 0.6); }

.status-box {
  display: flex;
  justify-content: space-between;
  border: 1px solid var(--tw-border);
  border-radius: 7px;
  padding: 6px 9px;
  margin: 10px 0;
  overflow: hidden;
}
.status-box span { color: #4f9e78; font-size: 10px; }
.status-box b { color: #a9ffd2; font-size: 11px; }
.kv { display: grid; grid-template-columns: auto 1fr; gap: 3px 12px; }
.kv span { color: #4f9e78; font-size: 10.5px; }
.kv b { color: #a9ffd2; font-size: 10.5px; text-align: right; font-weight: 600; }
.close-btn {
  width: 100%;
  margin-top: 12px;
  font-family: var(--tw-mono);
  font-size: 10.5px;
  color: #a9ffd2;
  background: rgba(20, 46, 34, 0.5);
  border: 1px solid rgba(110, 255, 180, 0.3);
  border-radius: 7px;
  padding: 6px 0;
  cursor: pointer;
}
.close-btn:hover { background: rgba(40, 90, 66, 0.6); }
.empty { color: #3f8a67; line-height: 1.9; padding: 8px 0; }
</style>
