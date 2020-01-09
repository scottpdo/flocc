/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
/// <reference path="../types/NRange.d.ts" />
import { Environment } from "../environments/Environment";
import { NumArray } from "../helpers/NumArray";
import mean from "../utils/mean";
import extractRoundNumbers from "../utils/extractRoundNumbers";

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
    max: 500
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
    const buffer = new NumArray();
    this.metrics.push(
      Object.assign({}, defaultMetricOptions, opts, {
        key,
        buffer
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
    const markers = extractRoundNumbers(range);

    const { min, max } = range;
    let increment = 10 ** Math.round(Math.log10(max - min) - 1); // start from closest power of 10 difference, over 10
    let ticker = 0; // 0 = 1, 1 = 2, 2 = 5, etc.
    while ((max - min) / increment > 8) {
      increment *= ticker % 3 === 1 ? 2.5 : 2;
      ticker++;
    }

    let textMaxWidth = 0;
    // write numbers
    backgroundContext.font = `${14 * window.devicePixelRatio}px Helvetica`;
    backgroundContext.fillStyle = "#000";
    backgroundContext.textBaseline = "middle";

    markers.forEach(marker => {
      const { width } = backgroundContext.measureText(marker.toLocaleString());
      if (width > textMaxWidth) textMaxWidth = width;
      backgroundContext.fillText(marker.toLocaleString(), 5, this.y(marker));
    });

    // draw lines
    markers.forEach(marker => {
      backgroundContext.moveTo(textMaxWidth + 10, this.y(marker));
      backgroundContext.lineTo(this.x(width), this.y(marker));
      backgroundContext.setLineDash([10, 10]);
      backgroundContext.stroke();
    });
  }

  render() {
    const { canvas, environment, metrics } = this;
    const { width, height } = this;
    const context = canvas.getContext("2d");

    // clear existing canvas by drawing background
    context.drawImage(this.background, 0, 0, width, height);

    const agents = environment.getAgents();

    // initialize values map -- for each metric, a pairing of `key` and an empty array
    const values: Map<string, number[]> = new Map();
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
      const { buffer, color, fn, key } = metric;

      // push new value to buffer
      buffer.set(this.t, fn(values.get(key)));

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
