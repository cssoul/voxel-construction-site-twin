<script setup lang="ts">
import { useTwinStore } from '../composables/useTwinStore';

const store = useTwinStore();
</script>

<template>
  <div class="tw-panel title-card">
    <div class="accent" />
    <div class="txt">
      <div class="big">体素工地 · 数字孪生</div>
      <div class="sub">VOXEL CONSTRUCTION SITE TWIN · 第叁项目部 · 安全生产</div>
    </div>
  </div>
</template>

<style scoped>
.title-card {
  top: 14px;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px 9px 12px;
  border: none;
  background: none;
  box-shadow: none
}
.accent {
  width: 4px;
  height: 30px;
  flex: none;
}
.big {
  color: #eafff4;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.22em;
}
.sub {
  color: #4f9e78;
  font-size: 8.5px;
  letter-spacing: 0.14em;
  margin-top: 2px;
}
.live-chip {
  font-size: 9px;
  color: #5affa0;
  border: 1px solid rgba(90, 255, 160, 0.45);
  border-radius: 999px;
  padding: 1px 8px;
  letter-spacing: 0.18em;
  background: rgba(90, 255, 160, 0.08);
}
</style>
