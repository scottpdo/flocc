/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import { Environment } from "../environments/Environment";
import remap from "../utils/remap";

interface Metric extends NRange {
  aboveMax: boolean;
  color: string;
  belowMin: boolean;
  buckets: number;
  key: string;
}

interface MetricOptions extends NRange {
  aboveMax: boolean;
  color: string;
  belowMin: boolean;
  buckets: number;
}

const defaultMetricOptions: MetricOptions = {
  aboveMax: false,
  color: "#000",
  belowMin: false,
  buckets: 1,
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
  height: number;
  width: number;

  constructor(environment: Environment) {
    this.environment = environment;
    this.canvas.width = 500;
    this.canvas.height = 500;
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
    const width = 500;
    const height = 200;
    const context = canvas.getContext("2d");

    const agents = environment.getAgents();

    context.clearRect(0, 0, width, height);

    this.metrics.forEach(metric => {
      const { buckets, color, key, max, min } = metric;
      context.fillStyle = color;
      const bucketValues = new Array(buckets).fill(0);
      agents.forEach(agent => {
        if (agent.get(key) === null) return;
        const value = agent.get(key);
        const bucketIndex = Math.floor(
          remap(value, min, max, 0, 0.999999) * buckets
        );
        bucketValues[bucketIndex]++;
      });
      bucketValues.forEach((value, i) => {
        context.fillRect(
          i * (width / buckets),
          height - value,
          width / buckets,
          value
        );
      });
    });
  }
}

export { Histogram };
