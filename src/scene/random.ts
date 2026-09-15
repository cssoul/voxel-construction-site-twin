/** 确定性随机（与静态版一致的种子，保证构图稳定） */
let _seed = 7;
export function srand(): number {
  _seed = (_seed * 16807) % 2147483647;
  return _seed / 2147483647;
}
export function resetSeed(seed = 7): void {
  _seed = seed;
}
export function rand(a = 1, b?: number): number {
  return b === undefined ? Math.random() * a : a + Math.random() * (b - a);
}
export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
export const clamp01 = (v: number): number => clamp(v, 0, 1);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const ease = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const smooth01 = (t: number): number => {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
};
export const TAU = Math.PI * 2;
export const pad2 = (n: number): string => String(n).padStart(2, '0');
