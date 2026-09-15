import type { SiteConfig, TwinEntityDef } from './types';
import { SITE_CONFIG } from './config';

/**
 * 数据层：所有业务数据统一从这里获取。
 *
 * - 默认使用本地 mock（src/data/config.ts），完全离线可用；
 * - 接入后端时，在 .env 中配置 VITE_TWIN_API_BASE（如 http://localhost:8080/api/twin），
 *   并保证接口返回与 SiteConfig / TwinEntityDef 同构的 JSON：
 *     GET ${VITE_TWIN_API_BASE}/site-config  -> SiteConfig
 *     GET ${VITE_TWIN_API_BASE}/entities     -> TwinEntityDef[]
 * - 若后端协议不同，只需改写本文件中的 remoteApi 实现，页面与场景无需改动。
 */

const API_BASE: string = (import.meta.env.VITE_TWIN_API_BASE as string | undefined) ?? '';

async function delay<T>(value: T, ms = 60): Promise<T> {
  await new Promise((r) => setTimeout(r, ms));
  return value;
}

const mockApi = {
  async fetchSiteConfig(): Promise<SiteConfig> {
    return delay(structuredClone(SITE_CONFIG));
  },
  async fetchEntities(): Promise<TwinEntityDef[]> {
    return delay(structuredClone(SITE_CONFIG.entities));
  },
};

const remoteApi = {
  async fetchSiteConfig(): Promise<SiteConfig> {
    const res = await fetch(`${API_BASE}/site-config`);
    if (!res.ok) throw new Error(`site-config ${res.status}`);
    return (await res.json()) as SiteConfig;
  },
  async fetchEntities(): Promise<TwinEntityDef[]> {
    const res = await fetch(`${API_BASE}/entities`);
    if (!res.ok) throw new Error(`entities ${res.status}`);
    return (await res.json()) as TwinEntityDef[];
  },
};

export const api = API_BASE ? remoteApi : mockApi;
