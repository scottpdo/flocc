import type { Environment } from "../environments/Environment";

class AbstractRenderer {
  /** @member Environment */
  environment: Environment;
  canvas: HTMLCanvasElement = document.createElement("canvas");
  context: CanvasRenderingContext2D = this.canvas.getContext("2d");
  width: number;
  height: number;

  render() {}

  /**
   * Mount this renderer to a DOM element. Pass either a string representing a
   * CSS selector matching the element (i.e. `"#element-id") or the element itself.
   * @param {string | HTMLElement} el
   */
  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      container.innerHTML = "";
      container.appendChild(this.canvas);
    }
  }
}

export { AbstractRenderer };
