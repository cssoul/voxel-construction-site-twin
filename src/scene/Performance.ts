/** FPS 计量（0.5s 窗口） */
export class Performance {
  private frames = 0;
  private acc = 0;

  update(dt: number): number | null {
    this.frames++;
    this.acc += dt;
    if (this.acc >= 0.5) {
      const fps = Math.round(this.frames / this.acc);
      this.frames = 0;
      this.acc = 0;
      return fps;
    }
    return null;
  }
}
