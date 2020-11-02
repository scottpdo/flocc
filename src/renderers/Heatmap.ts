/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import { Environment } from "../environments/Environment";

interface HeatmapAxis extends NRange {}

interface HeatmapOptions {
  x: string | HeatmapAxis;
  y: string | HeatmapAxis;
  height: number;
  width: number;
  scale: "relative" | "fixed";
}

const defaultHeatmapOptions: HeatmapOptions = {
  x: "x",
  y: "y",
  height: 500,
  width: 500,
  scale: "fixed"
};

class Heatmap implements Renderer {
  /** @member Environment` */
  environment: Environment;
  /** @member HTMLCanvasElement */
  canvas: HTMLCanvasElement = document.createElement("canvas");
  opts: HeatmapOptions;
  width: number;
  height: number;

  constructor(environment: Environment, opts?: HeatmapOptions) {
    this.environment = environment;
    this.opts = Object.assign({}, this.opts, opts);
    const { width, height } = this.opts;
    const dpr = window.devicePixelRatio;
    this.width = width * dpr;
    this.height = height * dpr;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    environment.renderers.push(this);
  }

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

  render() {}
}

export { Heatmap };
