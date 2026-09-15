import * as THREE from 'three';
import { makeCanvas, ctex } from '../canvas';
import { srand, TAU } from '../random';
import { routeFromCorners } from '../paths';
import type { RouteCorner, RoutePt } from '../paths';
import type { SiteConfig } from '../../data/types';

/** 全部程序化贴图（木纹/地面/蓝图/标识/标签…），与静态版一致 */
export const TEX = {
  wood: null as THREE.CanvasTexture | null,
  ground: null as THREE.CanvasTexture | null,
};

export function woodTexture(): THREE.CanvasTexture {
  const c = makeCanvas(1024, 640);
  const x = c.getContext('2d')!;
  x.fillStyle = '#463122';
  x.fillRect(0, 0, 1024, 640);
  for (let i = 0; i < 130; i++) {
    const y0 = srand() * 640;
    const dark = srand() > 0.5;
    x.strokeStyle = dark
      ? `rgba(30,20,12,${0.05 + srand() * 0.1})`
      : `rgba(120,86,52,${0.04 + srand() * 0.08})`;
    x.lineWidth = 0.6 + srand() * 2.2;
    x.beginPath();
    x.moveTo(-10, y0);
    for (let px = 0; px <= 1034; px += 64) x.lineTo(px, y0 + Math.sin(px * 0.008 + i) * 6 + (srand() - 0.5) * 7);
    x.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const kx = srand() * 1024;
    const ky = srand() * 640;
    for (let r = 2; r < 16; r += 3) {
      x.strokeStyle = `rgba(25,16,9,${0.12 - r * 0.005})`;
      x.lineWidth = 1.4;
      x.beginPath();
      x.ellipse(kx, ky, r * 1.7, r, r * 0.4, 0, TAU);
      x.stroke();
    }
  }
  for (let i = 0; i < 2400; i++) {
    x.fillStyle = `rgba(0,0,0,${srand() * 0.05})`;
    x.fillRect(srand() * 1024, srand() * 640, 2, 2);
  }
  return ctex(c);
}

export function groundTextureCanvas(cfg: SiteConfig): THREE.CanvasTexture {
  const W = 1536;
  const Hc = 1088;
  const c = makeCanvas(W, Hc);
  const x = c.getContext('2d')!;
  const S = W / 48;
  const X = (wx: number) => (wx + 24) * S;
  const Z = (wz: number) => (wz + 17) * S;
  const { pit: PIT, road: ROAD, gate: GATE } = cfg;

  x.fillStyle = '#7a6748';
  x.fillRect(0, 0, W, Hc);
  const tones = ['#6d5b3e', '#87744f', '#72603f', '#8d7a55'];
  for (let i = 0; i < 3200; i++) {
    x.fillStyle = tones[(srand() * 4) | 0];
    x.globalAlpha = 0.06 + srand() * 0.1;
    x.fillRect(srand() * W, srand() * Hc, 2 + srand() * 12, 2 + srand() * 8);
  }
  x.globalAlpha = 1;

  x.fillStyle = '#8d867a';
  x.fillRect(X(15.2), Z(-8.4), (22.5 - 15.2) * S, (4.4 + 8.4) * S);
  x.fillStyle = '#99938a';
  for (let i = 0; i < 900; i++) {
    x.globalAlpha = 0.25;
    x.fillRect(X(15.2) + srand() * (22.5 - 15.2) * S, Z(-8.4) + srand() * (4.4 + 8.4) * S, 2, 2);
  }
  x.globalAlpha = 1;
  x.fillStyle = '#9aa0a2';
  x.fillRect(X(0.0), Z(-6.1), 11 * S, 8.6 * S);
  x.strokeStyle = '#84898c';
  x.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    x.beginPath();
    x.moveTo(X(0) + ((i * 11) / 5) * S, Z(-6.1));
    x.lineTo(X(0) + ((i * 11) / 5) * S, Z(2.5));
    x.stroke();
  }
  x.fillStyle = '#9b958c';
  x.fillRect(X(-21.4), Z(12.4), 17.4 * S, 3.9 * S);
  x.fillStyle = '#66513a';
  x.fillRect(X(-9.6), Z(-16.1), 10.2 * S, 6.1 * S);
  x.fillStyle = '#8a7a58';
  x.fillRect(X(-23.3), Z(-3.0), 7.8 * S, 10.9 * S);
  x.fillStyle = '#2e2417';
  x.fillRect(X(PIT.x0), Z(PIT.z0), PIT.w * S, PIT.d * S);

  const hatch = (x0: number, z0: number, x1: number, z1: number) => {
    x.save();
    x.beginPath();
    x.rect(X(x0), Z(z0), (x1 - x0) * S, (z1 - z0) * S);
    x.clip();
    x.strokeStyle = '#c8372a';
    x.lineWidth = 7;
    for (let d = -40; d < 80; d += 16) {
      x.beginPath();
      x.moveTo(X(x0) + d * S * 0.5 - 40, Z(z0) - 6);
      x.lineTo(X(x0) + d * S * 0.5 + 40, Z(z1) + 6);
      x.stroke();
    }
    x.restore();
  };
  hatch(PIT.x0 - 0.5, PIT.z0 - 0.5, PIT.x1 + 0.5, PIT.z0 - 0.12);
  hatch(PIT.x0 - 0.5, PIT.z1 + 0.12, PIT.x1 + 0.5, PIT.z1 + 0.5);
  hatch(PIT.x0 - 0.5, PIT.z0 - 0.5, PIT.x0 - 0.12, PIT.z1 + 0.5);
  hatch(PIT.x1 + 0.12, PIT.z0 - 0.5, PIT.x1 + 0.5, PIT.z1 + 0.5);

  const loop = routeFromCorners(
    [
      { x: -ROAD.hw, z: -ROAD.hh },
      { x: ROAD.hw, z: -ROAD.hh },
      { x: ROAD.hw, z: ROAD.hh },
      { x: 9, z: ROAD.hh },
      { x: -ROAD.hw, z: ROAD.hh },
    ] as RouteCorner[],
    3,
  );
  const drawPath = (pts: RoutePt[], widthPx: number, color: string, alpha = 1) => {
    x.globalAlpha = alpha;
    x.strokeStyle = color;
    x.lineWidth = widthPx;
    x.lineJoin = 'round';
    x.lineCap = 'round';
    x.beginPath();
    pts.forEach((p, i) => (i ? x.lineTo(X(p.x), Z(p.z)) : x.moveTo(X(p.x), Z(p.z))));
    x.closePath();
    x.stroke();
    x.globalAlpha = 1;
  };
  const main: RoutePt[] = [
    { x: 9, z: 16.8 },
    { x: 9, z: ROAD.hh },
  ];
  const spur: RoutePt[] = [
    { x: -4.6, z: -8 },
    { x: -4.6, z: -11.6 },
    { x: -1.6, z: -12.9 },
    { x: 1.4, z: -12.9 },
    { x: 1.4, z: -8 },
  ];
  [loop, main, spur].forEach((path) => drawPath(path, 4.3 * S, '#7c7257'));
  [loop, main, spur].forEach((path) => drawPath(path, 3.4 * S, '#45474c'));
  [loop, main, spur].forEach((path) => drawPath(path, 1.9 * S, '#3a3c40', 0.85));
  drawPath([{ x: -13, z: 6 }, { x: -13, z: -6 }], 0.5 * S, '#33353a', 0.5);
  drawPath([{ x: 13, z: 6 }, { x: 13, z: -6 }], 0.5 * S, '#33353a', 0.5);
  drawPath([{ x: 8, z: 15 }, { x: 10, z: 15 }], 0.5 * S, '#33353a', 0.5);

  x.save();
  x.beginPath();
  x.rect(X(6.6), Z(14.2), 4.8 * S, 1.6 * S);
  x.clip();
  x.fillStyle = '#d8d8d4';
  for (let i = 0; i < 7; i += 2) x.fillRect(X(6.6) + i * 0.7 * S, Z(14.2), 0.7 * S, 1.6 * S);
  x.restore();

  const vg = x.createRadialGradient(W / 2, Hc / 2, Hc * 0.42, W / 2, Hc / 2, Hc * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(20,12,4,0.34)');
  x.fillStyle = vg;
  x.fillRect(0, 0, W, Hc);
  return ctex(c);
}

export function blueprintTexture(): THREE.CanvasTexture {
  const c = makeCanvas(512, 360);
  const x = c.getContext('2d')!;
  x.fillStyle = '#dfe9f1';
  x.fillRect(0, 0, 512, 360);
  x.strokeStyle = '#b7cddd';
  x.lineWidth = 1;
  for (let i = 0; i < 512; i += 24) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, 360);
    x.stroke();
  }
  for (let i = 0; i < 360; i += 24) {
    x.beginPath();
    x.moveTo(0, i);
    x.lineTo(512, i);
    x.stroke();
  }
  x.strokeStyle = '#3f6a99';
  x.lineWidth = 3;
  x.strokeRect(70, 60, 300, 210);
  x.lineWidth = 1.5;
  x.strokeRect(80, 70, 280, 190);
  x.beginPath();
  x.moveTo(80, 160); x.lineTo(360, 160);
  x.moveTo(200, 70); x.lineTo(200, 260);
  x.stroke();
  x.beginPath();
  x.moveTo(280, 160); x.lineTo(280, 260);
  x.stroke();
  x.beginPath();
  x.arc(120, 210, 18, 0, Math.PI);
  x.stroke();
  for (let i = 0; i < 9; i++) {
    x.beginPath();
    x.moveTo(300 + i * 6, 180);
    x.lineTo(294 + i * 6, 240);
    x.stroke();
  }
  x.strokeStyle = '#5a83ad';
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(70, 290); x.lineTo(370, 290);
  x.stroke();
  x.fillStyle = '#3f6a99';
  x.font = '11px monospace';
  x.textAlign = 'center';
  x.fillText('6000', 220, 286);
  x.strokeRect(390, 60, 100, 240);
  x.fillStyle = '#33567c';
  x.font = 'bold 13px monospace';
  x.textAlign = 'left';
  x.fillText('VOXEL TOWER', 398, 84);
  x.font = '10px monospace';
  x.fillText('F2 PLAN', 398, 102);
  x.fillText('SCALE 1:100', 398, 118);
  x.fillText('REV.C3', 398, 134);
  x.fillStyle = '#c25543';
  x.save();
  x.translate(180, 320);
  x.rotate(-0.06);
  x.font = 'bold 15px monospace';
  x.fillText('CHECKED', 0, 0);
  x.restore();
  return ctex(c);
}

export function tapeTexture(): THREE.CanvasTexture {
  const c = makeCanvas(256, 32);
  const x = c.getContext('2d')!;
  x.fillStyle = '#e8c832';
  x.fillRect(0, 0, 256, 32);
  x.fillStyle = '#222';
  for (let i = 8; i < 256; i += 16) {
    x.fillRect(i, 4, 2, 10);
    x.fillRect(i + 5, 4, 1, 6);
  }
  x.font = '9px monospace';
  for (let i = 0; i < 8; i++) x.fillText(String(i * 2), 12 + i * 32, 26);
  return ctex(c);
}

export function warningSignTexture(): THREE.CanvasTexture {
  const c = makeCanvas(128, 128);
  const x = c.getContext('2d')!;
  x.fillStyle = '#f4c531';
  x.fillRect(0, 0, 128, 128);
  x.strokeStyle = '#222';
  x.lineWidth = 10;
  x.strokeRect(6, 6, 116, 116);
  x.fillStyle = '#222';
  x.beginPath();
  x.moveTo(64, 26);
  x.lineTo(100, 88);
  x.lineTo(28, 88);
  x.closePath();
  x.fill();
  x.fillStyle = '#f4c531';
  x.font = 'bold 44px monospace';
  x.textAlign = 'center';
  x.fillText('!', 64, 80);
  return ctex(c);
}

export function bannerTexture(): THREE.CanvasTexture {
  const c = makeCanvas(512, 64);
  const x = c.getContext('2d')!;
  x.fillStyle = '#14538f';
  x.fillRect(0, 0, 512, 64);
  x.fillStyle = '#fff';
  x.font = 'bold 34px sans-serif';
  x.textAlign = 'center';
  x.fillText('安 全 生 产 · 质 量 第 一', 256, 44);
  return ctex(c);
}

export function boardTexture(): THREE.CanvasTexture {
  const c = makeCanvas(256, 150);
  const x = c.getContext('2d')!;
  x.fillStyle = '#e8e6df';
  x.fillRect(0, 0, 256, 150);
  x.fillStyle = '#c0392b';
  x.fillRect(0, 0, 256, 30);
  x.fillStyle = '#fff';
  x.font = 'bold 17px sans-serif';
  x.textAlign = 'center';
  x.fillText('安 全 生 产 公 示', 128, 21);
  x.fillStyle = '#555';
  x.font = '11px sans-serif';
  x.textAlign = 'left';
  const lines = ['今日作业:基坑支护', '风险源:塔吊作业', '负责人:王工', '气象:晴 26℃', '进入现场请佩戴安全帽', '联系电话:8888-6666'];
  lines.forEach((t, i) => x.fillText(t, 10, 48 + i * 17));
  x.strokeStyle = '#999';
  x.strokeRect(4, 4, 248, 142);
  return ctex(c);
}

export function gateSignTexture(): THREE.CanvasTexture {
  const c = makeCanvas(1024, 110);
  const x = c.getContext('2d')!;
  x.fillStyle = '#1d3a66';
  x.fillRect(0, 0, 1024, 110);
  x.strokeStyle = '#dce8f4';
  x.lineWidth = 4;
  x.strokeRect(6, 6, 1012, 98);
  x.fillStyle = '#fff';
  x.font = 'bold 46px sans-serif';
  x.textAlign = 'center';
  x.fillText('VOXEL 数字建造集团 · 第叁项目部', 512, 58);
  x.fillStyle = '#9fc3e8';
  x.font = '24px monospace';
  x.fillText('SAFETY FIRST · 安全生产', 512, 92);
  return ctex(c);
}

export function consoleLabelTexture(): THREE.CanvasTexture {
  const c = makeCanvas(1024, 160);
  const x = c.getContext('2d')!;
  x.fillStyle = '#191c20';
  x.fillRect(0, 0, 1024, 160);
  const labels = ['SPEED', 'TIME', 'DUST'];
  const subs = [
    ['0.2', '1', '3'],
    ['PAUSE', '1×', '3×'],
    ['LOW', 'MED', 'HIGH'],
  ];
  labels.forEach((t, i) => {
    const cx0 = i * 341 + 170;
    x.fillStyle = '#7dffb0';
    x.font = 'bold 44px monospace';
    x.textAlign = 'center';
    x.fillText(t, cx0, 58);
    x.fillStyle = '#3d7a5c';
    x.font = '20px monospace';
    x.fillText(subs[i][0], cx0 - 120, 128);
    x.fillText(subs[i][1], cx0, 128);
    x.fillText(subs[i][2], cx0 + 120, 128);
    x.strokeStyle = '#2c4a3a';
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(cx0 - 140, 86);
    x.lineTo(cx0 + 140, 86);
    x.stroke();
  });
  return ctex(c);
}

export type SignKind = 'dig' | 'shock' | 'helmet' | 'fire' | 'speed5';

export function signTexture(kind: SignKind): THREE.CanvasTexture {
  const c = makeCanvas(128, 128);
  const g = c.getContext('2d')!;
  if (kind === 'dig' || kind === 'shock') {
    g.fillStyle = '#f4c531';
    g.beginPath();
    g.moveTo(64, 8);
    g.lineTo(120, 112);
    g.lineTo(8, 112);
    g.closePath();
    g.fill();
    g.strokeStyle = '#222';
    g.lineWidth = 7;
    g.stroke();
    g.fillStyle = '#222';
    if (kind === 'dig') {
      g.fillRect(58, 48, 12, 34);
      g.beginPath();
      g.arc(64, 94, 7, 0, TAU);
      g.fill();
    } else {
      g.beginPath();
      g.moveTo(70, 40); g.lineTo(52, 72); g.lineTo(64, 72); g.lineTo(56, 96); g.lineTo(80, 62); g.lineTo(66, 62);
      g.closePath();
      g.fill();
    }
  } else if (kind === 'helmet') {
    g.fillStyle = '#1a56a0';
    g.beginPath();
    g.arc(64, 64, 56, 0, TAU);
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(64, 64, 44, 0, TAU);
    g.fill();
    g.fillStyle = '#1a56a0';
    g.beginPath();
    g.arc(64, 74, 30, Math.PI, 0);
    g.fill();
    g.fillRect(26, 72, 76, 9);
  } else if (kind === 'fire') {
    g.fillStyle = '#c0392b';
    g.beginPath();
    g.arc(64, 64, 56, 0, TAU);
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(64, 64, 42, 0, TAU);
    g.fill();
    g.strokeStyle = '#c0392b';
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(24, 26);
    g.lineTo(110, 104);
    g.stroke();
    g.fillStyle = '#c0392b';
    g.fillRect(56, 44, 16, 30);
    g.beginPath();
    g.arc(64, 88, 9, 0, TAU);
    g.fill();
  } else {
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(64, 64, 56, 0, TAU);
    g.fill();
    g.strokeStyle = '#c0392b';
    g.lineWidth = 12;
    g.beginPath();
    g.arc(64, 64, 50, 0, TAU);
    g.stroke();
    g.fillStyle = '#222';
    g.font = 'bold 64px sans-serif';
    g.textAlign = 'center';
    g.fillText('5', 64, 86);
  }
  return ctex(c);
}
