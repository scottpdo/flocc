/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import { Environment } from "../environments/Environment";
import remap from "../utils/remap";
import { default as getMax } from "../utils/max";
import extractRoundNumbers from "../utils/extractRoundNumbers";

interface HistogramOptions {
  aboveMax: boolean;
  belowMin: boolean;
  buckets: number;
  color: string;
  height: number;
  max: number;
  min: number;
  width: number;
  scale: "relative" | "fixed";
}

const defaultHistogramOptions: HistogramOptions = {
  aboveMax: false,
  belowMin: false,
  buckets: 1,
  color: "#000",
  height: 500,
  max: 1,
  min: 0,
  width: 500,
  scale: "fixed"
};

class Histogram implements Renderer {
  /** @member Environment` */
  environment: Environment;
  /** @member HTMLCanvasElement */
  canvas: HTMLCanvasElement = document.createElement("canvas");
  background: HTMLCanvasElement = document.createElement("canvas");
  _metric: string;
  opts: HistogramOptions = defaultHistogramOptions;
  height: number;
  markerWidth: number = 0;
  width: number;

  constructor(environment: Environment, opts?: HistogramOptions) {
    this.environment = environment;
    this.opts = Object.assign(this.opts, opts);
    const { width, height } = this.opts;
    const dpr = window.devicePixelRatio;
    this.width = width * dpr;
    this.height = height * dpr;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    this.background.width = width * dpr;
    this.background.height = height * dpr;
    environment.renderers.push(this);
  }

  metric(_metric: string): void {
    this._metric = _metric;
  }

  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      container.innerHTML = "";
      container.appendChild(this.canvas);
    }
  }

  x(value: number): number {
    const { width, markerWidth } = this;
    return remap(value, 0, width, markerWidth, width);
  }

  y(value: number, maxValue: number): number {
    const { height } = this;
    return remap(value, 0, maxValue, height - 30, 0);
  }

  drawMarkers(bucketValues: Array<number>): void {
    const context = this.canvas.getContext("2d");
    const { environment, height, width } = this;
    const metric = this._metric;
    const agents = environment.getAgents();
    const { buckets, scale, min, max } = this.opts;
    const yMin = 0;
    const yMax = scale === "fixed" ? agents.length : getMax(bucketValues);
    const markers = extractRoundNumbers({ min: yMin, max: yMax });
    context.fillStyle = "black";
    context.font = `${14 * window.devicePixelRatio}px Helvetica`;
    markers.forEach(marker => {
      const { width } = context.measureText(marker.toLocaleString());
      if (width > this.markerWidth) this.markerWidth = width;
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(marker.toLocaleString(), 0, this.y(marker, yMax));
    });

    // draw lines
    markers.forEach(marker => {
      context.moveTo(this.markerWidth + 10, this.y(marker, yMax));
      context.lineTo(this.width, this.y(marker, yMax));
      context.setLineDash([10, 10]);
      context.stroke();
    });

    bucketValues
      .map((v, i) => {
        return (
          remap(i, 0, bucketValues.length, min, max).toLocaleString() +
          "–" +
          remap(i + 1, 0, bucketValues.length, min, max).toLocaleString()
        );
      })
      .forEach((label, i) => {
        context.textAlign = "center";
        context.textBaseline = "alphabetic";
        context.fillText(
          label,
          this.x((i * width) / buckets + (0.5 * width) / buckets),
          height - 3
        );
      });
  }

  render(): void {
    if (!this._metric) return;
    const { canvas, environment, width, height } = this;
    const metric = this._metric;
    const { buckets, color, scale, max, min } = this.opts;
    const context = canvas.getContext("2d");

    const agents = environment.getAgents();

    context.clearRect(0, 0, width, height);

    // initialize map of bucket values --
    // array of length `buckets`, initialized to all zeros
    const bucketValues = new Array(buckets).fill(0);

    agents.forEach(agent => {
      // ignore this agent if it doesn't have the metric in question
      if (agent.get(metric) === null) return;

      // calculate index of bucket this agent's value says it belongs in
      const bucketIndex = Math.floor(
        remap(agent.get(metric), min, max, 0, 0.999999) * buckets
      );

      // increment the corresponding value in the bucketValues array
      bucketValues[bucketIndex]++;
    });

    this.drawMarkers(bucketValues);

    context.fillStyle = color;

    const maxValue = scale === "fixed" ? agents.length : getMax(bucketValues);
    bucketValues.forEach((value, i) => {
      const mappedValue = remap(value, 0, maxValue, 0, 1);
      context.fillRect(
        this.x(((i + 0.1) * width) / buckets),
        remap(mappedValue, 0, 1, height - 30, 0),
        (0.8 * (width - this.markerWidth)) / buckets,
        remap(mappedValue, 0, 1, 0, height - 30)
      );
    });
  }
}

export { Histogram };
