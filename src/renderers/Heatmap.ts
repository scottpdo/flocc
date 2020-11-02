/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import { Environment } from "../environments/Environment";
import remap from "../utils/remap";

const PADDING_AT_BOTTOM = 60;
const PADDING_AT_LEFT = 60;

interface HeatmapAxis extends NRange {
  buckets: number;
  key: string;
}

const isAxisObject = (obj: any): obj is HeatmapAxis => {
  return (
    obj &&
    typeof obj !== "string" &&
    obj.hasOwnProperty("buckets") &&
    obj.hasOwnProperty("key")
  );
};

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
  buckets: number[];
  localMax: number;
  lastUpdatedScale: Date;

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

    this.buckets = new Array(this.getBuckets("x") * this.getBuckets("y")).fill(
      0
    );

    this.drawMarkers();
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

  x(value: number): number {
    const { width } = this;
    return remap(value, 0, width, PADDING_AT_LEFT, width);
  }

  y(value: number): number {
    const { height } = this;
    return remap(value, 0, height, 0, height - PADDING_AT_BOTTOM);
  }

  getKey(axis: "x" | "y"): string {
    const a = this.opts[axis];
    if (isAxisObject(a)) {
      return a.key;
    } else {
      return a;
    }
  }

  getBuckets(axis: "x" | "y"): number {
    const a = this.opts[axis];
    if (isAxisObject(a)) return a.buckets;
    return 10;
  }

  getMin(axis: "x" | "y"): number {
    const a = this.opts[axis];
    if (isAxisObject(a)) {
      return a.min;
    } else {
      return 0;
    }
  }

  getMax(axis: "x" | "y"): number {
    const a = this.opts[axis];
    if (isAxisObject(a)) {
      return a.max;
    } else {
      return 1;
    }
  }

  drawMarkers() {
    const { canvas, width, height } = this;
    const context = canvas.getContext("2d");

    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(PADDING_AT_LEFT - 1, 0);
    context.lineTo(PADDING_AT_LEFT - 1, height - PADDING_AT_BOTTOM + 1);
    context.lineTo(width, height - PADDING_AT_BOTTOM + 1);
    context.stroke();

    context.lineWidth = 0;
    const gradient = context.createLinearGradient(10, 0, PADDING_AT_LEFT, 0);
    gradient.addColorStop(0, "white");
    gradient.addColorStop(1, "black");
    context.fillStyle = gradient;
    context.fillRect(
      10,
      height - PADDING_AT_BOTTOM + 10,
      PADDING_AT_LEFT - 20,
      20
    );
  }

  updateScale() {
    const { canvas, width, height } = this;
    const context = canvas.getContext("2d");

    if (!this.lastUpdatedScale || +new Date() - +this.lastUpdatedScale > 250) {
      context.clearRect(0, height - 30, PADDING_AT_LEFT, 30);

      context.fillStyle = "black";
      context.font = `${12 * window.devicePixelRatio}px Helvetica`;
      context.textAlign = "center";
      context.fillText("0", 10, height - 15);
      context.fillText(
        this.localMax.toString(),
        PADDING_AT_LEFT - 10,
        height - 15
      );

      this.lastUpdatedScale = new Date();
    }
  }

  drawRectangles() {
    const { canvas, width, height } = this;
    const context = canvas.getContext("2d");
    const xBuckets = this.getBuckets("x");
    const yBuckets = this.getBuckets("y");

    // clear background by drawing white rectangle
    context.fillStyle = "white";
    context.fillRect(PADDING_AT_LEFT, 0, width, height - PADDING_AT_BOTTOM);

    for (let i = 0; i < this.buckets.length; i++) {
      // alpha corresponds to the number of agents in the bucket
      const a = remap(this.buckets[i], 0, this.localMax, 0, 1);
      // always a black rectangle, just at different opacities
      context.fillStyle = `rgba(0, 0, 0, ${a})`;
      const w = width / xBuckets;
      const h = height / yBuckets;
      const x = w * (i % xBuckets);
      const y = h * ((i / xBuckets) | 0);
      context.fillRect(
        this.x(x),
        this.y(y),
        w * ((width - PADDING_AT_LEFT) / width),
        h * ((height - PADDING_AT_BOTTOM) / height)
      );
    }
  }

  resetBuckets() {
    for (let i = 0; i < this.getBuckets("x") * this.getBuckets("y"); i++) {
      this.buckets[i] = 0;
    }
  }

  updateBuckets() {
    const { environment } = this;
    const xKey = this.getKey("x");
    const yKey = this.getKey("y");
    const xMin = this.getMin("x");
    const yMin = this.getMin("y");
    const xMax = this.getMax("x");
    const yMax = this.getMax("y");
    const xBuckets = this.getBuckets("x");
    const yBuckets = this.getBuckets("y");

    // reset localMax
    this.localMax = 0;

    // loop over agents and fill appropriate buckets
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
        this.buckets[index]++;
        if (this.buckets[index] > this.localMax) {
          this.localMax = this.buckets[index];
        }
      }
    });
  }

  render() {
    this.updateBuckets();

    this.drawRectangles();
    this.updateScale();

    // reset
    this.resetBuckets();
  }
}

export { Heatmap };
