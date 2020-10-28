/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import { Environment } from "../environments/Environment";
import remap from "../utils/remap";
import { default as getMax } from "../utils/max";
import extractRoundNumbers from "../utils/extractRoundNumbers";

const LINE_DASH = [10, 10];
const PADDING_AT_BOTTOM = 60;
const PADDING_AT_LEFT = 20;
const PADDING_AT_RIGHT = 30;

interface HistogramOptions {
  aboveMax: boolean;
  belowMin: boolean;
  buckets: number | any[];
  color: string;
  epsilon: number;
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
  epsilon: 0,
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
    this.opts = Object.assign({}, this.opts, opts);
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
    return remap(
      value,
      0,
      width,
      markerWidth + PADDING_AT_LEFT,
      width - PADDING_AT_RIGHT
    );
  }

  y(value: number, maxValue: number): number {
    const { height } = this;
    return remap(value, 0, maxValue, height - PADDING_AT_BOTTOM, 0);
  }

  drawMarkers(bucketValues: number[]): void {
    const context = this.canvas.getContext("2d");
    const { environment, height, width } = this;
    const agents = environment.getAgents();
    const { aboveMax, belowMin, buckets, scale, min, max } = this.opts;
    const yMin = 0;
    const yMax = scale === "fixed" ? agents.length : getMax(bucketValues);
    const markers = extractRoundNumbers({ min: yMin, max: yMax });
    context.fillStyle = "black";
    context.font = `${14 * window.devicePixelRatio}px Helvetica`;
    // determine the width of the longest marker
    markers.forEach(marker => {
      const { width } = context.measureText(marker.toLocaleString());
      if (width > this.markerWidth) this.markerWidth = width;
    });

    // draw lines
    markers.forEach(marker => {
      context.textAlign = "right";
      context.textBaseline = "middle";
      context.fillText(
        marker.toLocaleString(),
        this.markerWidth,
        this.y(marker, yMax)
      );
      context.beginPath();
      context.moveTo(this.markerWidth + 10, this.y(marker, yMax));
      context.lineTo(this.width, this.y(marker, yMax));
      context.setLineDash(LINE_DASH);
      context.stroke();
    });

    const numBuckets =
      bucketValues.length - (aboveMax ? 1 : 0) - (belowMin ? 1 : 0);

    // write labels below bars
    bucketValues
      .map((v, i) => {
        if (buckets instanceof Array) return buckets[i].toString();
        if (i === 0 && belowMin) {
          return `< ${min}`;
        } else if (i === bucketValues.length - 1 && aboveMax) {
          return `> ${max}`;
        }
        const currentIndex = i - (belowMin ? 1 : 0);
        return (
          remap(currentIndex, 0, numBuckets, min, max).toLocaleString() +
          "..." +
          remap(currentIndex + 1, 0, numBuckets, min, max).toLocaleString()
        );
      })
      .forEach((label, i) => {
        context.save();
        context.translate(
          this.x(
            (i * width) / bucketValues.length +
              (0.5 * width) / bucketValues.length
          ),
          height - 50
        );
        context.rotate(Math.PI / 4);
        context.font = `${12 * window.devicePixelRatio}px Helvetica`;
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillText(label, 0, 0);
        context.restore();
      });
  }

  render(): void {
    if (!this._metric) return;
    const { canvas, environment, width, height } = this;
    const metric = this._metric;
    const {
      aboveMax,
      belowMin,
      buckets,
      color,
      epsilon,
      scale,
      max,
      min
    } = this.opts;
    const context = canvas.getContext("2d");

    const agents = environment.getAgents();

    context.clearRect(0, 0, width, height);

    // initialize map of bucket values --
    // array of length `buckets`, initialized to all zeros,
    // plus 1 if aboveMax, plus another 1 if belowMin
    const numBuckets =
      buckets instanceof Array
        ? buckets.length
        : buckets + (aboveMax ? 1 : 0) + (belowMin ? 1 : 0);
    const bucketValues = new Array(numBuckets).fill(0);

    const data = environment.stat(metric);

    data.forEach(value => {
      // Calculate index of bucket this agent's value says it belongs in.
      // If given an array of discrete bucket values, only match the exact
      // (or within epsilon) one
      if (Array.isArray(buckets)) {
        const index = buckets.findIndex(
          v => v === value || Math.abs(v - value) <= epsilon
        );
        return bucketValues[index]++;
      }

      // Shortcut if value is above max and we are allowing
      // values above the max.
      if (aboveMax && value > max) {
        return bucketValues[bucketValues.length - 1]++;
        // Same thing but for below min.
      } else if (belowMin && value < min) {
        return bucketValues[0]++;
        // Otherwise, only track if the value is in the allowed range.
      } else if (value >= min && value <= max) {
        const index =
          Math.floor(remap(value, min, max, 0, 0.999999) * buckets) +
          (belowMin ? 1 : 0);
        bucketValues[index]++;
      }
    });

    this.drawMarkers(bucketValues);

    context.fillStyle = color;

    const maxValue = scale === "fixed" ? agents.length : getMax(bucketValues);
    bucketValues.forEach((value, i) => {
      const mappedValue = remap(value, 0, maxValue, 0, 1);
      context.fillRect(
        this.x(((i + 0.1) * width) / numBuckets),
        remap(mappedValue, 0, 1, height - PADDING_AT_BOTTOM, 0),
        (0.8 * (width - this.markerWidth)) / numBuckets,
        remap(mappedValue, 0, 1, 0, height - PADDING_AT_BOTTOM)
      );
    });
  }
}

export { Histogram };
