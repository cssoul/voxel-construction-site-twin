import { computed } from 'vue';
import { setTimeOfDay, useTwinStore } from './useTwinStore';

export interface TimePreset {
  label: string;
  en: string;
  hour: number;
}

export const TIME_PRESETS: TimePreset[] = [
  { label: '黎明', en: 'DAWN', hour: 6.0 },
  { label: '正午', en: 'NOON', hour: 12.0 },
  { label: '黄昏', en: 'SUNSET', hour: 18.2 },
  { label: '夜晚', en: 'NIGHT', hour: 22.0 },
];

/** 一天的时间控制（左侧面板用）：滑杆 + 预设 + 自动流逝开关 */
export function useDayNight() {
  const store = useTwinStore();
  return {
    hour: computed({
      get: () => store.timeOfDay,
      set: (v: number) => setTimeOfDay(v),
    }),
    clockText: computed(() => store.clockText),
    autoTime: computed({
      get: () => store.autoTime,
      set: (v: boolean) => {
        store.autoTime = v;
      },
    }),
    presets: TIME_PRESETS,
    applyPreset: (p: TimePreset) => setTimeOfDay(p.hour),
  };
}
