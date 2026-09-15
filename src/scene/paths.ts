import * as THREE from 'three';

export interface RouteCorner {
  x: number;
  z: number;
  stop?: { dur: number; act: string };
}

export interface RoutePt {
  x: number;
  z: number;
}

/** 角点 → Chaikin 平滑 → 密集点列 */
export function routeFromCorners(corners: RouteCorner[], iters = 2): RoutePt[] {
  let pts: RoutePt[] = corners.map((c) => ({ x: c.x, z: c.z }));
  for (let k = 0; k < iters; k++) {
    const out: RoutePt[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      out.push({ x: a.x * 0.75 + b.x * 0.25, z: a.z * 0.75 + b.z * 0.25 });
      out.push({ x: a.x * 0.25 + b.x * 0.75, z: a.z * 0.25 + b.z * 0.75 });
    }
    pts = out;
  }
  return pts;
}

export interface RouteStop {
  s: number;
  dur: number;
  act: string;
}

/** 闭合路径跟随器：按弧长采样位置与朝向 */
export class Follower {
  pts: RoutePt[];
  cum: number[] = [0];
  total: number;
  s: number;
  stops: RouteStop[];
  stopIdx = 0;
  readonly n: number;

  constructor(corners: RouteCorner[], s0 = 0, smooth = 2) {
    this.pts = routeFromCorners(corners, smooth);
    this.n = this.pts.length;
    let L = 0;
    for (let i = 0; i < this.n; i++) {
      const a = this.pts[i];
      const b = this.pts[(i + 1) % this.n];
      L += Math.hypot(b.x - a.x, b.z - a.z);
      this.cum.push(L);
    }
    this.total = L;
    this.s = ((s0 % L) + L) % L;
    this.stops = [];
    corners.forEach((c) => {
      if (c.stop) {
        let best = 0;
        let bd = 1e18;
        for (let i = 0; i < this.n; i++) {
          const p = this.pts[i];
          const dd = (p.x - c.x) ** 2 + (p.z - c.z) ** 2;
          if (dd < bd) {
            bd = dd;
            best = i;
          }
        }
        this.stops.push({ s: this.cum[best], dur: c.stop.dur, act: c.stop.act });
      }
    });
    this.stops.sort((a, b) => a.s - b.s);
  }

  advance(ds: number): void {
    this.s = ((this.s + ds) % this.total + this.total) % this.total;
  }

  posAt(s: number, out: RoutePt): RoutePt {
    const n = this.n;
    s = ((s % this.total) + this.total) % this.total;
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.cum[mid] <= s) lo = mid;
      else hi = mid - 1;
    }
    const i = lo;
    const t = (s - this.cum[i]) / Math.max(1e-6, this.cum[i + 1] - this.cum[i]);
    const a = this.pts[i];
    const b = this.pts[(i + 1) % n];
    out.x = a.x + (b.x - a.x) * t;
    out.z = a.z + (b.z - a.z) * t;
    return out;
  }
}

/** 沙盘边界硬限制 */
export function clampPosition(p: THREE.Vector3, bound: { x: number; z: number }, minY: number): void {
  p.x = THREE.MathUtils.clamp(p.x, -bound.x, bound.x);
  p.z = THREE.MathUtils.clamp(p.z, -bound.z, bound.z);
  if (p.y < minY) p.y = minY;
  if (p.y > 40) p.y = 40;
}
