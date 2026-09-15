import * as THREE from 'three';
import { clamp, TAU } from './random';

export interface ViewSpec {
  yaw: number;
  pitch: number;
  dist: number;
  target: [number, number, number];
}

/** 环绕相机：拖拽/缩放/聚焦与视角预设飞行/自动环绕 */
export class CameraController {
  yaw = -0.52;
  pitch = 0.36;
  dist = 58;
  target = new THREE.Vector3(0, 3.0, 1.0);
  private desiredTarget: THREE.Vector3 | null = null;
  private desiredDist = 0;
  private desYaw: number | null = null;
  private desPitch: number | null = null;
  private camera: THREE.PerspectiveCamera;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  orbit(dx: number, dy: number): void {
    this.yaw -= dx * 0.005;
    this.pitch = clamp(this.pitch + dy * 0.004, 0.12, 1.32);
    this.cancelFly();
  }

  zoom(deltaY: number): void {
    this.dist = clamp(this.dist * (1 + deltaY * 0.0011), 16, 72);
    this.desiredTarget = null;
  }

  /** 聚焦到目标点（保持当前朝向） */
  flyTo(target: THREE.Vector3, dist: number): void {
    this.desiredTarget = target.clone();
    this.desiredDist = clamp(dist, 10, 60);
  }

  /** 应用视角预设（位置 + 朝向一起平滑过渡） */
  setView(v: ViewSpec): void {
    this.flyTo(new THREE.Vector3(v.target[0], v.target[1], v.target[2]), v.dist);
    let dy = v.yaw - this.yaw;
    while (dy > Math.PI) dy -= TAU;
    while (dy < -Math.PI) dy += TAU;
    this.desYaw = this.yaw + dy;
    this.desPitch = clamp(v.pitch, 0.12, 1.32);
  }

  private cancelFly(): void {
    this.desiredTarget = null;
    this.desYaw = null;
    this.desPitch = null;
  }

  update(dt: number, idle: boolean): void {
    if (idle) this.yaw += dt * 0.045; // 自动环绕（极慢）
    const k = Math.min(1, dt * 3.5);
    if (this.desiredTarget) {
      this.target.lerp(this.desiredTarget, k);
      this.dist += (this.desiredDist - this.dist) * k;
      if (this.target.distanceTo(this.desiredTarget) < 0.05 && Math.abs(this.dist - this.desiredDist) < 0.05) {
        this.desiredTarget = null;
      }
    }
    if (this.desYaw !== null && this.desPitch !== null) {
      this.yaw += (this.desYaw - this.yaw) * k;
      this.pitch += (this.desPitch - this.pitch) * k;
      if (Math.abs(this.desYaw - this.yaw) < 0.005 && Math.abs(this.desPitch - this.pitch) < 0.005) {
        this.desYaw = null;
        this.desPitch = null;
      }
    }
    const cp = Math.cos(this.pitch);
    this.camera.position.set(
      this.target.x + Math.sin(this.yaw) * cp * this.dist,
      this.target.y + Math.sin(this.pitch) * this.dist,
      this.target.z + Math.cos(this.yaw) * cp * this.dist,
    );
    this.camera.lookAt(this.target);
  }
}
