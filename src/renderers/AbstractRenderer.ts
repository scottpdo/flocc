import type { Environment } from "../environments/Environment";

class AbstractRenderer {
  environment: Environment;
  canvas: HTMLCanvasElement = document.createElement("canvas");
  context: CanvasRenderingContext2D = this.canvas.getContext("2d");
  width: number;
  height: number;

  render() {}

  /**
   * Mount this renderer to a DOM element. Pass either a string representing a
   * CSS selector matching the element or the element itself.
   * @example
   * ```js
   * // mounts the renderer to the element with the ID `container`
   * renderer.mount('#container');
   *
   * // mounts the renderer to the element itself
   * const container = document.getElementById('container');
   * renderer.mount(container);
   * ```
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
