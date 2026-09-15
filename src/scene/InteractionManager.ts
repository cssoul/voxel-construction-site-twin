import * as THREE from 'three';
import { clamp } from './random';
import type { CameraController } from './CameraController';
import type { TwinManager } from './twin/TwinManager';

export interface InteractionDeps {
  dom: HTMLElement;
  camera: THREE.PerspectiveCamera;
  knobMeshes: THREE.Mesh[];
  applyKnob: (i: number, t: number) => void;
  knobValue: (i: number) => number;
  twins: TwinManager;
  cameraCtrl: CameraController;
  onSelect: (id: string | null) => void;
}

/** 交互：实体旋钮拖拽 / 相机环绕 / 点击拾取实体 / 滚轮缩放 */
export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private deps: InteractionDeps;
  private dragging = false;
  private dragKnob = -1;
  private lastX = 0;
  private lastY = 0;
  private startX = 0;
  private startT = 0;
  private moved = 0;
  private lastPointer = { x: 0, y: 0 };
  private lastAct = performance.now();

  constructor(deps: InteractionDeps) {
    this.deps = deps;
    const el = deps.dom;
    el.style.touchAction = 'none';
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointercancel', this.onUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });
  }

  get idleMs(): number {
    return performance.now() - this.lastAct;
  }

  dispose(): void {
    const el = this.deps.dom;
    el.removeEventListener('pointerdown', this.onDown);
    el.removeEventListener('pointermove', this.onMove);
    el.removeEventListener('pointerup', this.onUp);
    el.removeEventListener('pointercancel', this.onUp);
    el.removeEventListener('wheel', this.onWheel);
  }

  private onDown = (e: PointerEvent): void => {
    this.lastAct = performance.now();
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.deps.camera);
    const hits = this.raycaster.intersectObjects(this.deps.knobMeshes, false);
    if (hits.length) {
      this.dragKnob = hits[0].object.userData.knob as number;
      this.startT = this.deps.knobValue(this.dragKnob);
      this.startX = e.clientX;
      this.moved = 0;
    } else {
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.moved = 0;
    }
    this.deps.dom.setPointerCapture(e.pointerId);
  };

  private onMove = (e: PointerEvent): void => {
    if (this.dragKnob >= 0) {
      const t = clamp(this.startT + (e.clientX - this.startX) * 0.0042, 0, 1);
      this.deps.applyKnob(this.dragKnob, t);
      this.moved += 1;
    } else if (this.dragging) {
      this.deps.cameraCtrl.orbit(e.clientX - this.lastX, e.clientY - this.lastY);
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.moved += Math.abs(e.movementX ?? 0) + Math.abs(e.movementY ?? 0);
    } else {
      this.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      this.raycaster.setFromCamera(this.ndc, this.deps.camera);
      const hits = this.raycaster.intersectObjects(this.deps.knobMeshes, false);
      this.deps.dom.style.cursor = hits.length ? 'pointer' : 'grab';
    }
    this.lastAct = performance.now();
  };

  private onUp = (e: PointerEvent): void => {
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.dragging = false;
    if (this.dragKnob >= 0) {
      this.deps.applyKnob(this.dragKnob, this.deps.knobValue(this.dragKnob));
      this.dragKnob = -1;
    } else if (this.moved < 5) {
      this.pick();
    }
    this.lastAct = performance.now();
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.deps.cameraCtrl.zoom(e.deltaY);
    this.lastAct = performance.now();
  };

  private pick(): void {
    this.ndc.set((this.lastPointer.x / innerWidth) * 2 - 1, -(this.lastPointer.y / innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.deps.camera);
    const roots = this.deps.twins.pickRoots;
    if (!roots.length) {
      this.deps.onSelect(null);
      return;
    }
    const hits = this.raycaster.intersectObjects(roots, true);
    if (!hits.length) {
      this.deps.onSelect(null);
      return;
    }
    const hit = hits[0];
    if (hit.object.userData.workerMesh === 'legs' && hit.instanceId !== undefined) {
      this.deps.onSelect(this.deps.twins.resolveWorkerId(hit.instanceId));
      return;
    }
    let o: THREE.Object3D | null = hit.object;
    while (o) {
      if (o.userData.entityId) {
        this.deps.onSelect(o.userData.entityId as string);
        return;
      }
      o = o.parent;
    }
    this.deps.onSelect(null);
  }
}
