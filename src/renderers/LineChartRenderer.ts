/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import { NumArray } from "../helpers/NumArray";
import mean from "../utils/mean";
import extractRoundNumbers from "../utils/extractRoundNumbers";
import { AbstractRenderer } from "./AbstractRenderer";
import type { Environment } from "../environments/Environment";

const PADDING_BOTTOM = 10;
const lineDash = [10, 10];

type MetricFunction = (arr: Array<number>) => number;

interface Metric {
  color: string;
  buffer: NumArray;
  fn: MetricFunction;
  key: string;
}

interface MetricOptions {
  color?: string;
  fn?: MetricFunction;
}

interface LineChartRendererOptions {
  autoScale?: boolean;
  autoScroll?: boolean;
  background?: string;
  height?: number;
  range?: NRange;
  width?: number;
}

const defaultRendererOptions: LineChartRendererOptions = {
  autoScale: false,
  autoScroll: false,
  background: "transparent",
  height: 500,
  range: {
    min: 0,
    max: 1
  },
  width: 500
};

const defaultMetricOptions = {
  color: "#000",
  fn: mean
};

/**
 * @since 0.2.0
 */
class LineChartRenderer extends AbstractRenderer {
  background: HTMLCanvasElement = document.createElement("canvas");
  opts: LineChartRendererOptions;
  metrics: Metric[] = [];
  t: number = 0;

  constructor(environment: Environment, opts?: LineChartRendererOptions) {
    super();
    this.environment = environment;
    this.opts = Object.assign({}, defaultRendererOptions, opts);
    this.opts.range = Object.assign({}, this.opts.range);
    const { width, height } = this.opts;
    const dpr = window.devicePixelRatio;
    this.width = this.opts.width * dpr;
    this.height = this.opts.height * dpr;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    this.background.width = width * dpr;
    this.background.height = height * dpr;
    environment.renderers.push(this);
  }

  /**
   * @since 0.2.0
   */
  metric(key: string, opts?: MetricOptions) {
    const buffer = new NumArray();
    const metric: Metric = { key, buffer, ...defaultMetricOptions };
    Object.assign(metric, opts);
    this.metrics.push(metric);
  }

  x(value: number): number {
    const { opts, t, width } = this;
    let x = value;
    if (opts.autoScroll && t >= width) {
      x -= t - width;
    } else if (opts.autoScale) {
      x *= width / t;
    }
    return x | 0;
  }

  y(value: number): number {
    const { height } = this;
    const { range } = this.opts;
    const { min, max } = range;
    const dpr = window.devicePixelRatio;
    const paddingBottom = PADDING_BOTTOM * dpr;
    const pxPerUnit = (height - 2 * paddingBottom) / (max - min);
    return Math.round(height - (value - min) * pxPerUnit) - 2 * paddingBottom;
  }

  drawBackground() {
    const { context, width, height, opts, t } = this;
    const dpr = window.devicePixelRatio;
    const paddingBottom = PADDING_BOTTOM * dpr;
    // draw background and lines
    context.fillStyle = this.opts.background;
    context.fillRect(0, 0, width, height);

    const { range } = this.opts;
    const markers = extractRoundNumbers(range);

    let textMaxWidth = 0;
    // write values on vertical axis
    context.font = `${14 * dpr}px Helvetica`;
    context.fillStyle = "#000";
    context.textBaseline = "middle";

    markers.forEach(marker => {
      if (this.y(marker) < 10 * dpr || this.y(marker) + 10 * dpr > height) return;
      const { width } = context.measureText(marker.toLocaleString());
      if (width > textMaxWidth) textMaxWidth = width;
      context.fillText(marker.toLocaleString(), 5 * dpr, this.y(marker));
    });

    // draw horizontal lines for vertical axis
    context.save();
    context.strokeStyle = "#999";
    markers.forEach(marker => {
      if (this.y(marker) >= height - paddingBottom) return;
      context.beginPath();
      context.moveTo(textMaxWidth + 10 * dpr, this.y(marker));
      context.lineTo(
        this.x(Math.max(width, this.environment.time)),
        this.y(marker)
      );
      context.setLineDash(lineDash.map(v => v * dpr));
      context.stroke();
    });
    context.restore();

    // draw time values for horizontal axis
    const min = opts.autoScroll && t >= width ? t - width : 0;
    const max = opts.autoScale ? Math.max(t, 5) : width;
    const timeRange: NRange = { min, max };
    const timeMarkers = extractRoundNumbers(timeRange);
    context.save();
    context.textAlign = "center";
    timeMarkers.forEach(marker => {
      const { width } = context.measureText(marker.toLocaleString());
      if (
        this.x(marker) + width / 2 > this.width ||
        this.x(marker) - width / 2 < textMaxWidth
      ) {
        return;
      }

      context.font = `${11 * dpr}px Helvetica`;
      context.fillText(
        marker.toLocaleString(),
        this.x(marker),
        height - paddingBottom
      );

      context.strokeStyle = "black";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(this.x(marker), height - 4 * dpr);
      context.lineTo(this.x(marker), height);
      context.stroke();
    });
    context.restore();
  }

  render() {
    const { context, environment, metrics, width, height, opts } = this;

    // clear canvas and draw background
    context.clearRect(0, 0, width, height);
    this.drawBackground();

    // initialize values map -- for each metric, a pairing of `key` and an empty array
    const values: Map<string, number[]> = new Map();
    metrics.forEach(({ key }) => values.set(key, environment.stat(key)));

    // finally, for each metric, use its function to derive the desired value
    // from all the agent data
    metrics.forEach(metric => {
      const { buffer, color, fn, key } = metric;

      // push new value to buffer
      const value = fn(values.get(key));
      buffer.set(this.t, value);
      if (opts.autoScale) {
        if (value < opts.range.min) this.opts.range.min = value;
        if (value > opts.range.max) this.opts.range.max = value;
      }

      context.strokeStyle = color;
      context.beginPath();

      for (let i = 0; i < buffer.length; i++) {
        const value = buffer.get(i);
        const x = this.x(i);
        const y = this.y(value);
        if (i === 0) context.moveTo(x, y);
        context.lineTo(x, y);
      }

      context.stroke();
    });

    this.t++;
  }
}

export { LineChartRenderer };
