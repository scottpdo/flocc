/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import remap from "../utils/remap";
import { AbstractRenderer } from "./AbstractRenderer";
import type { Environment } from "../environments/Environment";
import clamp from "../utils/clamp";
import once from "../utils/once";
import type HeatmapAxis from "../types/HeatmapAxis";

const PADDING_AT_BOTTOM = 60;
const PADDING_AT_LEFT = 60;

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

const warnOnce = once(console.warn.bind(console));

/**
 * A `Heatmap` can be used to visualize the distribution of {@linkcode Agent}s across two metrics.
 * While {@linkcode Histogram}s are useful for showing the distribution of `Agent`s along a single metric
 * (or on multiple metrics using the same scale), a `Heatmap` can show how two metrics relate to one another &mdash;
 * correlation, inverse correlation, in a nonlinear manner, randomly (no correlation), etc.
 *
 * <img src="https://cms.flocc.network/wp-content/uploads/2020/11/heatmap-basic.png" />
 *
 * Note above that, although the output appears similar to what a {@linkcode CanvasRenderer} might output, the `y` axis is reversed here &mdash; low values are at the bottom and high at the top, whereas on a `CanvasRenderer` high values are at the bottom and low at the top.
 *
 * @since 0.5.8
 */
class Heatmap extends AbstractRenderer {
  /** @hidden */
  opts: HeatmapOptions = defaultHeatmapOptions;
  width: number;
  height: number;
  /** @hidden */
  buckets: number[];
  /** @hidden */
  localMax: number;
  /** @hidden */
  lastUpdatedScale: Date;

  /**
   * The first parameter must be the {@linkcode Environment} that this
   * `Heatmap` will render.
   *
   * The second parameter specifies options, which can include:
   * - `from` (*string* = `"white"`) &mdash; The color (name, hex value, or RGB) to draw when a cell contains `0` {@linkcode Agent}s
   * - `to` (*string* = `"black"`) &mdash; The color (name, hex value, or RGB) to draw when a cell contains the highest number of `Agent`s
   * - `x` and `y` can be either:
   *   - *string* = `"x"`/`"y"` respectively &mdash; The name of `Agent` data to measure along the `x`/`y` axis
   *   - *{ buckets: number; key: string; min: number; max: number }* = `{ buckets: 10, key: 'x' | 'y', min: 0, max: 1 }` &mdash; Include the number of buckets to divide the range `min → max` into, along with the name of `Agent` data
   * - `width` (*number* = `500`) &mdash; The width, in pixels, of the canvas on which to render
   * - `height` (*number* = `500`) &mdash; The height, in pixels, of the canvas on which to render
   * - `scale` (either `"relative"` or `"fixed"`, defaults to `"relative"`)
   *   - `"relative"` &mdash; The maximum number of `Agent`s in any single cell is automatically used as the highest value in the scale. This updates over time based on `Agent` distribution.
   *   - `"fixed"` &mdash; You supply the number to use as the maximum value (see `max` below).
   * - `max` (optional, *number*) &mdash; If you use `scale = "fixed"`, then setting a `max` will cause cells with that number (or higher) of `Agent`s to be drawn using the `to` color.
   *
   * ```js
   * // plots the correlation between age of agents (on the x-axis)
   * // vs. their wealth (on the y-axis)
   * const heatmap = new Heatmap(environment, {
   *   x: 'age',
   *   y: 'wealth'
   * });
   * ```
   */
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
   * @hidden
   */
  x(value: number): number {
    const { width } = this;
    const dpr = window.devicePixelRatio;
    return remap(
      value,
      this.getMin("x"),
      this.getMax("x"),
      PADDING_AT_LEFT * dpr,
      width
    );
  }

  /**
   * Map a value (on the range y-min to y-max) onto canvas space to draw it along the y-axis.
   * @hidden
   */
  y(value: number): number {
    const { height } = this;
    const dpr = window.devicePixelRatio;
    return remap(
      value,
      this.getMin("y"),
      this.getMax("y"),
      height - PADDING_AT_BOTTOM * dpr,
      0
    );
  }

  /** @hidden */
  getKey(axis: "x" | "y"): string {
    const a = this.opts[axis];
    if (isAxisObject(a)) {
      return a.key;
    } else {
      return a;
    }
  }

  /** @hidden */
  getBuckets(axis: "x" | "y"): number {
    const a = this.opts[axis];
    if (isAxisObject(a) && a.hasOwnProperty("buckets")) return a.buckets;
    return 10;
  }

  /** @hidden */
  getMin(axis: "x" | "y"): number {
    const a = this.opts[axis];
    if (isAxisObject(a) && a.hasOwnProperty("min")) {
      return a.min;
    } else {
      return 0;
    }
  }

  /** @hidden */
  getMax(axis: "x" | "y"): number {
    const a = this.opts[axis];
    if (isAxisObject(a) && a.hasOwnProperty("max")) {
      return a.max;
    } else {
      return 1;
    }
  }

  /** @hidden */
  drawMarkers() {
    const { context, width, height } = this;
    const { from, to } = this.opts;
    const dpr = window.devicePixelRatio;
    const padLeft = PADDING_AT_LEFT * dpr;
    const padBottom = PADDING_AT_BOTTOM * dpr;

    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(padLeft - 1, 0);
    context.lineTo(padLeft - 1, height - padBottom + 1);
    context.lineTo(width, height - padBottom + 1);
    context.stroke();

    context.lineWidth = 0;
    const gradient = context.createLinearGradient(
      10 * dpr,
      0,
      padLeft - 10 * dpr,
      0
    );
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    context.fillStyle = gradient;
    context.fillRect(
      10 * dpr,
      height - padBottom + 20 * dpr,
      padLeft - 24 * dpr,
      20 * dpr
    );

    context.fillStyle = "black";

    let step = (this.getMax("x") - this.getMin("x")) / this.getBuckets("x");
    let originalStep = step;
    while (Math.abs(this.x(step) - this.x(0)) < 35 * dpr) step *= 2;

    for (
      let marker = this.getMin("x");
      marker <= this.getMax("x");
      marker += originalStep
    ) {
      if (this.x(marker) + 10 * dpr > width) continue;
      context.moveTo(this.x(marker), height - padBottom);
      context.lineTo(this.x(marker), height - padBottom + 10 * dpr);
      context.stroke();

      if (
        Math.abs(((marker - this.getMin("x")) / step) % 1) < 0.001 ||
        Math.abs((((marker - this.getMin("x")) / step) % 1) - 1) < 0.001
      ) {
        context.font = `${12 * dpr}px Helvetica`;
        context.textAlign = "center";
        context.fillText(
          marker.toLocaleString(),
          this.x(marker),
          height - padBottom + 24 * dpr
        );
      }
    }

    step = (this.getMax("y") - this.getMin("y")) / this.getBuckets("y");
    originalStep = step;
    while (Math.abs(this.y(step) - this.y(0)) < 20 * dpr) step *= 2;

    for (
      let marker = this.getMin("y");
      marker <= this.getMax("y");
      marker += originalStep
    ) {
      if (this.y(marker) - 10 * dpr < 0) continue;
      context.moveTo(padLeft, this.y(marker));
      context.lineTo(padLeft - 10 * dpr, this.y(marker));
      context.stroke();

      if (
        Math.abs(((marker - this.getMin("y")) / step) % 1) < 0.001 ||
        Math.abs((((marker - this.getMin("y")) / step) % 1) - 1) < 0.001
      ) {
        context.font = `${12 * dpr}px Helvetica`;
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillText(
          marker.toLocaleString(),
          padLeft - 14 * dpr,
          this.y(marker)
        );
      }
    }
  }

  /** @hidden */
  updateScale() {
    const { context, environment, height } = this;
    const { scale } = this.opts;
    const dpr = window.devicePixelRatio;
    const padLeft = PADDING_AT_LEFT * dpr;

    let max = scale === "relative" ? this.localMax : this.opts.max;
    if (max === undefined) {
      if (!this.lastUpdatedScale) {
        warnOnce(
          "A Heatmap with the `scale` option set to 'fixed' should include a `max` option. Defaulting to the number of Agents currently in the Environment."
        );
      }
      max = environment.getAgents().length;
    }

    if (!this.lastUpdatedScale || +new Date() - +this.lastUpdatedScale > 250) {
      context.clearRect(0, height - 20 * dpr, padLeft, 20 * dpr);

      context.fillStyle = "black";
      context.font = `${12 * dpr}px Helvetica`;
      context.textAlign = "center";
      context.textBaseline = "bottom";
      context.fillText("0", 10 * dpr, height - 5 * dpr);
      context.fillText(max.toString(), padLeft - 16 * dpr, height - 5 * dpr);

      this.lastUpdatedScale = new Date();
    }
  }

  /** @hidden */
  drawRectangles() {
    const { canvas, environment, width, height } = this;
    const { scale, from, to } = this.opts;
    const dpr = window.devicePixelRatio;
    const padLeft = PADDING_AT_LEFT * dpr;
    const padBottom = PADDING_AT_BOTTOM * dpr;
    const context = canvas.getContext("2d");
    const xBuckets = this.getBuckets("x");
    const yBuckets = this.getBuckets("y");
    let max = scale === "relative" ? this.localMax : this.opts.max;
    if (max === undefined) max = environment.getAgents().length;

    // clear background by drawing background rectangle
    context.fillStyle = from;
    context.fillRect(padLeft, 0, width - padLeft, height - padBottom);

    const w = (width - padLeft) / xBuckets;
    const h = (height - padBottom) / yBuckets;

    for (let row = 0; row < yBuckets; row++) {
      for (let column = 0; column < xBuckets; column++) {
        const index = row * xBuckets + column;
        // alpha corresponds to the number of agents in the bucket
        const a = clamp(remap(this.buckets[index], 0, max, 0, 1), 0, 1);
        context.fillStyle = to;
        context.globalAlpha = a;
        context.fillRect(
          this.x(
            remap(column, 0, xBuckets, this.getMin("x"), this.getMax("x"))
          ),
          this.y(
            remap(row, -1, yBuckets - 1, this.getMin("y"), this.getMax("y"))
          ),
          w,
          h
        );
      }
    }

    context.globalAlpha = 1;
  }

  /** @hidden */
  resetBuckets() {
    for (let i = 0; i < this.getBuckets("x") * this.getBuckets("y"); i++) {
      this.buckets[i] = 0;
    }
  }

  /** @hidden */
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
