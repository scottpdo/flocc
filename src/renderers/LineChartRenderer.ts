/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import { Environment } from "../environments/Environment";
import { utils } from "../utils/utils";

type MetricFunction = (arr: Array<number>) => number;

interface Metric {
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
  range: NRange;
  width: number;
}

const defaultRendererOptions: LineChartRendererOptions = {
  background: "transparent",
  height: 500,
  range: {
    min: 0,
    max: 500
  },
  width: 500
};

const defaultMetricOptions: MetricOptions = {
  color: "#000",
  fn: utils.mean
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

  constructor(environment: Environment, opts?: LineChartRendererOptions) {
    this.environment = environment;
    this.opts = Object.assign({}, defaultRendererOptions, opts);
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

  x(value: number): number {
    return Math.round(value);
  }

  y(value: number): number {
    const { height } = this;
    const { range } = this.opts;
    const { min, max } = range;
    const pxPerUnit = height / (max - min);
    return Math.round(this.canvas.height - (value - min) * pxPerUnit);
  }

  drawBackground() {
    const { width, height } = this;
    // draw background and lines
    const backgroundContext = this.background.getContext("2d");
    backgroundContext.fillStyle = this.opts.background;
    backgroundContext.fillRect(0, 0, width, height);

    const { range } = this.opts;
    const { min, max } = range;
    let increment = 10 ** Math.round(Math.log10(max - min) - 1); // start from closest power of 10 difference, over 10
    let ticker = 0; // 0 = 1, 1 = 2, 2 = 5, etc.
    while ((max - min) / increment > 8) {
      increment *= ticker % 3 === 1 ? 2.5 : 2;
      ticker++;
    }

    // determine y positions of start and end lines
    let start = min - ((min + increment) % increment);
    if (this.y(start) + 7 > height) start += increment; // keep within bounds
    let end = max - (max % increment);
    if (this.y(end) - 7 < 0) end -= increment; // same

    let textMaxWidth = 0;
    // write numbers
    backgroundContext.font = `${14 * window.devicePixelRatio}px Helvetica`;
    backgroundContext.fillStyle = "#000";
    backgroundContext.textBaseline = "middle";
    for (let y = start; y <= end; y += increment) {
      const { width } = backgroundContext.measureText(y.toLocaleString());
      if (width > textMaxWidth) textMaxWidth = width;
      backgroundContext.fillText(y.toLocaleString(), 5, this.y(y));
    }
    // draw lines
    for (let y = start; y <= end; y += increment) {
      backgroundContext.moveTo(textMaxWidth + 10, this.y(y));
      backgroundContext.lineTo(this.x(width), this.y(y));
      backgroundContext.setLineDash([10, 10]);
      backgroundContext.stroke();
    }
  }

  render() {
    const { canvas, environment, metrics } = this;
    const { width, height } = this;
    const context = canvas.getContext("2d");

    // clear existing canvas by drawing background
    context.drawImage(this.background, 0, 0, width, height);

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
      if (this.x(x) < 0) y = this.y(value);
      bufferContext.moveTo(this.x(x), y);
      bufferContext.lineTo(this.x(x + 1), this.y(value));
      bufferContext.stroke();
      location.x++;
      location.y = this.y(value);

      context.drawImage(buffer, 0, 0, width, height);
    });
  }
}

export { LineChartRenderer };
