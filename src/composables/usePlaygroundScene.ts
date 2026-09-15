import { onMounted, onUnmounted, watch } from 'vue';
import { SceneApp } from '../scene/SceneApp';
import { loadTwinData, selectEntity, toggleWeather, useTwinStore } from './useTwinStore';

/**
 * 场景装配组合式函数：
 * 1) 先经数据层加载配置（可替换接口）；
 * 2) 创建 SceneApp 装配三维场景；
 * 3) 建立 store <-> 场景 的联动（选中实体 / 空格暴雨）。
 */
export function usePlaygroundScene(container: { value: HTMLElement | null }): void {
  let app: SceneApp | null = null;
  const store = useTwinStore();
  let spaceHandler: ((e: KeyboardEvent) => void) | null = null;

  onMounted(async () => {
    await loadTwinData();
    if (!container.value) return;
    try {
      app = new SceneApp(container.value, store);
    } catch (err) {
      store.loadError = err instanceof Error ? err.message : String(err);
      console.error(err);
      return;
    }
    watch(
      () => store.selectionId,
      (id) => app?.focusSelection(id),
    );
    spaceHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleWeather();
      }
    };
    window.addEventListener('keydown', spaceHandler);

    // 深链：?select=crane-1 直接选中并聚焦实体
    const wanted = new URLSearchParams(location.search).get('select');
    if (wanted && store.entityDefs.some((e) => e.id === wanted)) selectEntity(wanted);
  });

  onUnmounted(() => {
    if (spaceHandler) window.removeEventListener('keydown', spaceHandler);
    app?.dispose();
    app = null;
    selectEntity(null);
  });
}
