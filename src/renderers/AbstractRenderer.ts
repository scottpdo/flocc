import type { Environment } from "../environments/Environment";

class AbstractRenderer {
  /**
   * Points to the {@linkcode Environment} that this
   * renderer is tied to. This is automatically set when the
   * renderer is created.
   */
  environment: Environment;
  /** @hidden */
  canvas: HTMLCanvasElement = document.createElement("canvas");
  /** @hidden */
  context: CanvasRenderingContext2D = this.canvas.getContext("2d");
  width: number;
  height: number;

  render() {}

  /**
   * Mount this renderer to a DOM element. Pass either a string representing a
   * CSS selector matching the element or the element itself.
   *
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
