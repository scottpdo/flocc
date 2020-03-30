/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import { Environment } from "../environments/Environment";
import { NumArray } from "../helpers/NumArray";
import mean from "../utils/mean";
import extractRoundNumbers from "../utils/extractRoundNumbers";

const lineDash = [10, 10];

type MetricFunction = (arr: Array<number>) => number;

interface Metric {
  color: string;
  buffer: NumArray;
  fn: MetricFunction;
  key: string;
}

interface MetricOptions {
  color: string;
  fn: MetricFunction;
}

interface LineChartRendererOptions {
  autoScale: boolean;
  autoScroll: boolean;
  background: string;
  height: number;
  range: NRange;
  width: number;
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

const defaultMetricOptions: MetricOptions = {
  color: "#000",
  fn: mean
};

class LineChartRenderer implements Renderer {
  /** @member Environment */
  environment: Environment;
  /** @member HTMLCanvasElement */
  canvas: HTMLCanvasElement = document.createElement("canvas");
  background: HTMLCanvasElement = document.createElement("canvas");
  opts: LineChartRendererOptions;
  metrics: Metric[] = [];
  height: number;
  width: number;
  t: number = 0;

  constructor(environment: Environment, opts?: LineChartRendererOptions) {
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

  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      container.innerHTML = "";
      container.appendChild(this.canvas);
    }
  }

  metric(key: string, opts?: MetricOptions) {
    const buffer = new NumArray();
    this.metrics.push(
      Object.assign({}, defaultMetricOptions, opts, {
        key,
        buffer
      })
    );
  }

  x(value: number): number {
    const { opts, t, width } = this;
    let x = value;
    if (opts.autoScroll && t >= width) {
      x -= t - width;
    } else if (opts.autoScale && t >= width) {
      x *= width / t;
    }
    return x | 0;
  }

  y(value: number): number {
    const { height } = this;
    const { range } = this.opts;
    const { min, max } = range;
    const pxPerUnit = height / (max - min);
    return Math.round(height - (value - min) * pxPerUnit - 22);
  }

  drawBackground() {
    const { canvas, width, height, opts, t } = this;
    // draw background and lines
    const context = canvas.getContext("2d");
    context.fillStyle = this.opts.background;
    context.fillRect(0, 0, width, height);

    const { range } = this.opts;
    const markers = extractRoundNumbers(range);

    let textMaxWidth = 0;
    // write values on vertical axis
    context.font = `${14 * window.devicePixelRatio}px Helvetica`;
    context.fillStyle = "#000";
    context.textBaseline = "middle";

    markers.forEach(marker => {
      if (this.y(marker) < 10 || this.y(marker) + 10 > height) return;
      const { width } = context.measureText(marker.toLocaleString());
      if (width > textMaxWidth) textMaxWidth = width;
      context.fillText(marker.toLocaleString(), 5, this.y(marker));
    });

    // draw horizontal lines for vertical axis
    context.save();
    context.strokeStyle = "#999";
    markers.forEach(marker => {
      if (this.y(marker) >= height - 10) return;
      context.beginPath();
      context.moveTo(textMaxWidth + 10, this.y(marker));
      context.lineTo(
        this.x(Math.max(width, this.environment.time)),
        this.y(marker)
      );
      context.setLineDash(lineDash);
      context.stroke();
    });
    context.restore();

    // draw time values for horizontal axis
    const min = opts.autoScroll && t >= width ? t - width : 0;
    const max = opts.autoScale && t >= width ? t : width;
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

      context.font = `${11 * window.devicePixelRatio}px Helvetica`;
      context.fillText(marker.toLocaleString(), this.x(marker), height - 10);

      context.strokeStyle = "black";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(this.x(marker), height - 4);
      context.lineTo(this.x(marker), height);
      context.stroke();
    });
    context.restore();
  }

  render() {
    const { canvas, environment, metrics, width, height, opts } = this;
    const context = canvas.getContext("2d");

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
