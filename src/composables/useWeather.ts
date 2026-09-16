import { computed } from 'vue';
import { setWeather, toggleWeather, useTwinStore } from './useTwinStore';

/** 天气控制（左侧面板用）：clear / rain / snow */
export function useWeather() {
  const store = useTwinStore();
  const isRain = computed(() => store.weather === 'rain');
  const isSnow = computed(() => store.weather === 'snow');
  return {
    isRain,
    isSnow,
    weather: computed(() => store.weather),
    setWeather,
    toggle: toggleWeather,
  };
}
