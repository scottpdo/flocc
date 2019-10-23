/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import { Environment } from "../environments/Environment";
import remap from "../utils/remap";
import max from "../utils/max";

interface MetricOptions extends NRange {
  color: string;
}

interface Metric extends MetricOptions {
  key: string;
}

interface HistogramOptions {
  aboveMax: boolean;
  belowMin: boolean;
  buckets: number;
  height: number;
  width: number;
  scale: "relative" | "fixed";
}

const defaultHistogramOptions: HistogramOptions = {
  aboveMax: false,
  belowMin: false,
  buckets: 1,
  height: 500,
  width: 500,
  scale: "fixed"
};

const defaultMetricOptions: MetricOptions = {
  color: "#000",
  min: 0,
  max: 1
};

class Histogram implements Renderer {
  /** @member Environment` */
  environment: Environment;
  /** @member HTMLCanvasElement */
  canvas: HTMLCanvasElement = document.createElement("canvas");
  background: HTMLCanvasElement = document.createElement("canvas");
  metrics: Metric[] = [];
  opts: HistogramOptions = defaultHistogramOptions;
  height: number;
  width: number;

  constructor(environment: Environment, opts?: HistogramOptions) {
    this.environment = environment;
    this.opts = Object.assign(this.opts, opts);
    const { width, height } = this.opts;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    environment.renderers.push(this);
  }

  metric(key: string, opts?: MetricOptions) {
    this.metrics.push(
      Object.assign({}, defaultMetricOptions, opts, {
        key
      })
    );
  }

  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      container.innerHTML = "";
      container.appendChild(this.canvas);
    }
  }

  render(): void {
    const { canvas, environment, metrics } = this;
    const { buckets, scale } = this.opts;
    const width = 500;
    const height = 200;
    const context = canvas.getContext("2d");

    const agents = environment.getAgents();

    context.clearRect(0, 0, width, height);

    // initialize map of bucket values -- for each metric, a pairing of `key` and an
    // array of length `buckets`, initialized to all zeros
    const mapOfBucketValues: Map<string, Array<number>> = new Map();
    metrics.forEach(({ key }) =>
      mapOfBucketValues.set(key, new Array(buckets).fill(0))
    );

    agents.forEach(agent => {
      metrics.forEach(({ key }) => {
        // ignore this agent if it doesn't have the metric key in question
        if (agent.get(key) === null) return;

        // get reference to array of bucket values
        const bucketValues = mapOfBucketValues.get(key);

        // calculate index of bucket this agent's value says it belongs in
        const bucketIndex = Math.floor(
          remap(agent.get(key), min, max, 0, 0.999999) * buckets
        );

        // increment the corresponding value in the bucketValues array
        bucketValues[bucketIndex]++;
      });
    });

    metrics.forEach(({ color, key }) => {
      context.fillStyle = color;

      const bucketValues = mapOfBucketValues.get(key);
      const maxValue = scale === "fixed" ? agents.length : max(bucketValues);
      bucketValues.forEach((value, i) => {
        const mappedValue = remap(value, 0, maxValue, 0, 1);
        context.fillRect(
          i * (width / buckets),
          remap(mappedValue, 0, 1, height, 0),
          width / buckets,
          remap(mappedValue, 0, 1, 0, height)
        );
      });
    });
  }
}

export { Histogram };
