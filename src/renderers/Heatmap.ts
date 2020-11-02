/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import { Environment } from "../environments/Environment";
import remap from "../utils/remap";

interface HeatmapAxis extends NRange {
  buckets: number;
  key: string;
}

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

  //   x(value: number): number {
  //     const { width } = this;
  //     return remap(value, 0, width, 0, width);
  //   }

  //   y() {}

  render() {
    const { environment, canvas, width, height } = this;
    const context = canvas.getContext("2d");
    const { x, y } = this.opts;
    const xKey = typeof x === "string" ? x : x.key;
    const yKey = typeof y === "string" ? y : y.key;
    const xBuckets = typeof x === "string" ? 10 : x.buckets;
    const yBuckets = typeof y === "string" ? 10 : y.buckets;
    const xMin = typeof x === "string" ? 0 : x.min;
    const yMin = typeof y === "string" ? 0 : y.min;
    const xMax = typeof x === "string" ? 0 : x.max;
    const yMax = typeof y === "string" ? 0 : y.max;

    // calculate and fill buckets
    const buckets = new Array(xBuckets * yBuckets).fill(0);

    let localMax = 0;

    environment.getAgents().forEach(agent => {
      const xValue = agent.get(xKey);
      const yValue = agent.get(yKey);
      const xBucket = remap(xValue, xMin, xMax, 0, xBuckets - 0.001) | 0;
      const yBucket = remap(yValue, yMin, yMax, 0, yBuckets - 0.001) | 0;
      if (
        xBucket >= 0 &&
        xBucket < xBuckets &&
        yBucket >= 0 &&
        yBucket < yBuckets
      ) {
        const index = xBucket + yBucket * xBuckets;
        buckets[index]++;
        if (buckets[index] > localMax) localMax = buckets[index];
      }
    });

    // now draw
    context.clearRect(0, 0, width, height);
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    buckets.forEach((bucket, i) => {
      const a = remap(bucket, 0, localMax, 0, 1);
      context.fillStyle = `rgba(0, 0, 0, ${a})`;
      const w = width / xBuckets;
      const h = height / yBuckets;
      const x = w * (i % xBuckets);
      const y = h * ((i / xBuckets) | 0);
      context.fillRect(x, y, w, h);
    });
  }
}

export { Heatmap };
