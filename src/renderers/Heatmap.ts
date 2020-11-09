/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import remap from "../utils/remap";
import { AbstractRenderer } from "./AbstractRenderer";
import type { Environment } from "../environments/Environment";

const PADDING_AT_BOTTOM = 60;
const PADDING_AT_LEFT = 60;

interface HeatmapAxis extends NRange {
  buckets: number;
  key: string;
}

const isAxisObject = (obj: any): obj is HeatmapAxis => {
  return obj && typeof obj !== "string";
};

interface HeatmapOptions {
  x: string | HeatmapAxis;
  y: string | HeatmapAxis;
  from: string;
  to: string;
  max?: number;
  height: number;
  width: number;
  scale: "relative" | "fixed";
}

const defaultHeatmapOptions: HeatmapOptions = {
  from: "#fff",
  to: "#000",
  x: "x",
  y: "y",
  height: 500,
  width: 500,
  scale: "relative"
};

class Heatmap extends AbstractRenderer {
  opts: HeatmapOptions = defaultHeatmapOptions;
  width: number;
  height: number;
  buckets: number[];
  localMax: number;
  lastUpdatedScale: Date;

  constructor(environment: Environment, opts?: HeatmapOptions) {
    super();
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
   * Map a value (on the range x-min to x-max) onto canvas space to draw it along the x-axis.
   * @param value
   */
  x(value: number): number {
    const { width } = this;
    return remap(
      value,
      this.getMin("x"),
      this.getMax("x"),
      PADDING_AT_LEFT,
      width
    );
  }

  /**
   * Map a value (on the range y-min to y-max) onto canvas space to draw it along the y-axis.
   * @param value
   */
  y(value: number): number {
    const { height } = this;
    return remap(
      value,
      this.getMin("y"),
      this.getMax("y"),
      height - PADDING_AT_BOTTOM,
      0
    );
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
    if (isAxisObject(a) && a.hasOwnProperty("buckets")) return a.buckets;
    return 10;
  }

  getMin(axis: "x" | "y"): number {
    const a = this.opts[axis];
    if (isAxisObject(a) && a.hasOwnProperty("min")) {
      return a.min;
    } else {
      return 0;
    }
  }

  getMax(axis: "x" | "y"): number {
    const a = this.opts[axis];
    if (isAxisObject(a) && a.hasOwnProperty("max")) {
      return a.max;
    } else {
      return 1;
    }
  }

  drawMarkers() {
    const { context, width, height } = this;
    const { from, to } = this.opts;

    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(PADDING_AT_LEFT - 1, 0);
    context.lineTo(PADDING_AT_LEFT - 1, height - PADDING_AT_BOTTOM + 1);
    context.lineTo(width, height - PADDING_AT_BOTTOM + 1);
    context.stroke();

    context.lineWidth = 0;
    const gradient = context.createLinearGradient(
      10,
      0,
      PADDING_AT_LEFT - 10,
      0
    );
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    context.fillStyle = gradient;
    context.fillRect(
      10,
      height - PADDING_AT_BOTTOM + 20,
      PADDING_AT_LEFT - 24,
      20
    );

    context.fillStyle = "black";

    let step = (this.getMax("x") - this.getMin("x")) / this.getBuckets("x");
    let originalStep = step;
    while (Math.abs(this.x(step) - this.x(0)) < 35) step *= 2;

    for (
      let marker = this.getMin("x");
      marker <= this.getMax("x");
      marker += originalStep
    ) {
      if (this.x(marker) + 10 > width) continue;
      context.moveTo(this.x(marker), height - PADDING_AT_BOTTOM);
      context.lineTo(this.x(marker), height - PADDING_AT_BOTTOM + 10);
      context.stroke();

      if (
        Math.abs(((marker - this.getMin("x")) / step) % 1) < 0.001 ||
        Math.abs((((marker - this.getMin("x")) / step) % 1) - 1) < 0.001
      ) {
        context.font = `${12 * window.devicePixelRatio}px Helvetica`;
        context.textAlign = "center";
        context.fillText(
          marker.toLocaleString(),
          this.x(marker),
          height - PADDING_AT_BOTTOM + 24
        );
      }
    }

    step = (this.getMax("y") - this.getMin("y")) / this.getBuckets("y");
    originalStep = step;
    while (Math.abs(this.y(step) - this.y(0)) < 20) step *= 2;

    for (
      let marker = this.getMin("y");
      marker <= this.getMax("y");
      marker += originalStep
    ) {
      if (this.y(marker) - 10 < 0) continue;
      context.moveTo(PADDING_AT_LEFT, this.y(marker));
      context.lineTo(PADDING_AT_LEFT - 10, this.y(marker));
      context.stroke();

      if (
        Math.abs(((marker - this.getMin("y")) / step) % 1) < 0.001 ||
        Math.abs((((marker - this.getMin("y")) / step) % 1) - 1) < 0.001
      ) {
        context.font = `${12 * window.devicePixelRatio}px Helvetica`;
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillText(
          marker.toLocaleString(),
          PADDING_AT_LEFT - 14,
          this.y(marker)
        );
      }
    }
  }

  updateScale() {
    const { context, environment, height } = this;
    const { scale } = this.opts;

    let max = scale === "relative" ? this.localMax : this.opts.max;
    if (max === undefined) {
      if (!this.lastUpdatedScale) {
        console.warn(
          "A Heatmap with the `scale` option set to 'fixed' should include a `max` option. Defaulting to the number of Agents currently in the Environment."
        );
      }
      max = environment.getAgents().length;
    }

    if (!this.lastUpdatedScale || +new Date() - +this.lastUpdatedScale > 250) {
      context.clearRect(0, height - 20, PADDING_AT_LEFT, 20);

      context.fillStyle = "black";
      context.font = `${12 * window.devicePixelRatio}px Helvetica`;
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.fillText("0", 10, height - 5);
      context.fillText(max.toString(), PADDING_AT_LEFT - 16, height - 5);

      this.lastUpdatedScale = new Date();
    }
  }

  drawRectangles() {
    const { canvas, environment, width, height } = this;
    const { scale, from, to } = this.opts;
    const context = canvas.getContext("2d");
    const xBuckets = this.getBuckets("x");
    const yBuckets = this.getBuckets("y");
    let max = scale === "relative" ? this.localMax : this.opts.max;
    if (max === undefined) max = environment.getAgents().length;

    // clear background by drawing background rectangle
    context.fillStyle = from;
    context.fillRect(PADDING_AT_LEFT, 0, width, height - PADDING_AT_BOTTOM);

    const w = width / xBuckets;
    const h = height / yBuckets;

    for (let row = 0; row < yBuckets; row++) {
      for (let column = 0; column < xBuckets; column++) {
        const index = row * xBuckets + column;
        // alpha corresponds to the number of agents in the bucket
        const a = remap(this.buckets[index], 0, max, 0, 1);
        context.fillStyle = to;
        context.globalAlpha = a;
        context.fillRect(
          this.x(
            remap(column, 0, xBuckets, this.getMin("x"), this.getMax("x"))
          ),
          this.y(
            remap(row, -1, yBuckets - 1, this.getMin("y"), this.getMax("y"))
          ),
          (w * (width - PADDING_AT_LEFT)) / width,
          (h * (height - PADDING_AT_BOTTOM)) / height
        );
      }
    }

    context.globalAlpha = 1;
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
      const xBucket = Math.floor(
        remap(xValue, xMin, xMax, 0, xBuckets - 0.001)
      );
      const yBucket = Math.floor(
        remap(yValue, yMin, yMax, 0, yBuckets - 0.001)
      );
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
