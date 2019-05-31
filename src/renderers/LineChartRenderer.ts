/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
import { Environment } from "../environments/Environment";
import { utils } from "../utils/utils";

type MetricFunction = (arr: Array<number>) => number;

declare interface Metric {
  color: string;
  buffer: HTMLCanvasElement;
  fn: MetricFunction;
  location: Point; // the last point drawn on the buffer canvas
  key: string;
}

interface MetricOptions {
  color: string;
  fn: MetricFunction;
}

interface LineChartRendererOptions {
  background: string;
  height: number;
  width: number;
}

const defaultRendererOptions: LineChartRendererOptions = {
  background: "transparent",
  height: 500,
  width: 500
};

const defaultMetricOptions: MetricOptions = {
  color: "#000",
  fn: utils.mean
};

class LineChartRenderer implements Renderer {
  /** @member Environment */
  environment: Environment;
  /** @member HTMLPreElement */
  canvas: HTMLCanvasElement = document.createElement("canvas");
  background: HTMLCanvasElement = document.createElement("canvas");
  opts: LineChartRendererOptions;
  metrics: Metric[] = [];
  height: number;
  width: number;

  constructor(environment: Environment, opts?: LineChartRendererOptions) {
    this.environment = environment;
    this.opts = Object.assign({}, defaultRendererOptions, opts);
    const { width, height } = this.opts;
    this.width = this.opts.width;
    this.height = this.opts.height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.background.width = width;
    this.background.height = height;
    environment.renderers.push(this);

    this.drawBackground();
  }

  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      container.innerHTML = "";
      container.appendChild(this.canvas);
    }
  }

  metric(key: string, opts?: MetricOptions) {
    const buffer = document.createElement("canvas");
    buffer.width = this.canvas.width;
    buffer.height = this.canvas.height;
    this.metrics.push(
      Object.assign({}, defaultMetricOptions, opts, {
        key,
        buffer,
        location: { x: -1, y: -1 }
      })
    );
  }

  y(value: number): number {
    return this.canvas.height - value;
  }

  drawBackground() {
    const { width, height } = this;
    // draw background and lines
    const backgroundContext = this.background.getContext("2d");
    backgroundContext.fillStyle = this.opts.background;
    backgroundContext.fillRect(0, 0, width, height);
    const range = {
      min: 0,
      max: height
    };
    const increment = (range.max - range.min) / 5;
    let textMaxWidth = 0;
    // write numbers
    backgroundContext.font = "16px Helvetica";
    backgroundContext.fillStyle = "#000";
    backgroundContext.textBaseline = "middle";
    for (let y = range.min; y < range.max; y += increment) {
      const { width } = backgroundContext.measureText(this.y(y).toString());
      if (width > textMaxWidth) textMaxWidth = width;
      backgroundContext.fillText(this.y(y).toString(), 5, y);
    }
    // draw lines
    for (let y = range.min; y < range.max; y += increment) {
      backgroundContext.moveTo(textMaxWidth + 10, y);
      backgroundContext.lineTo(width, y);
      backgroundContext.setLineDash([10, 10]);
      backgroundContext.stroke();
    }
  }

  render() {
    const { canvas, environment, metrics } = this;
    const { background } = this.opts;
    const context = canvas.getContext("2d");
    const { width, height } = canvas;

    // clear existing canvas by drawing background
    context.drawImage(this.background, 0, 0);

    const agents = environment.getAgents();

    // initialize values map -- for each metric, a pairing of `key` and an empty array
    const values: Map<string, Array<number>> = new Map();
    metrics.forEach(({ key }) => values.set(key, []));

    // loop over all the agents and, for each metric, push to the values map
    agents.forEach((agent, i) => {
      metrics.forEach(metric => {
        const { key } = metric;
        const data = agent.get(key);
        if (isNaN(data)) return;
        values.get(key)[i] = data;
      });
    });

    // finally, for each metric, use its function to derive the desired value
    // from all the agent data
    metrics.forEach(metric => {
      const { buffer, color, fn, location, key } = metric;
      let { x, y } = location;
      const bufferContext = buffer.getContext("2d");
      const value = fn(values.get(key));

      bufferContext.strokeStyle = color;
      if (x < 0) y = this.y(value);
      bufferContext.moveTo(x, y);
      bufferContext.lineTo(x + 1, this.y(value));
      bufferContext.stroke();
      location.x++;
      location.y = this.y(value);

      context.drawImage(buffer, 0, 0);
    });
  }
}

export { LineChartRenderer };
