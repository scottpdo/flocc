/// <reference path="./Renderer.d.ts" />
/// <reference path="../types/Point.d.ts" />
import { Environment } from "../environments/Environment";
import { Agent } from "../agents/Agent";

declare interface Metric {
  color: string;
  buffer: HTMLCanvasElement;
  location: Point;
  key: string;
}

interface MetricOptions {
  color: string;
}

const defaultOptions: MetricOptions = {
  color: "#000"
};

class LineChartRenderer implements Renderer {
  /** @member Environment */
  environment: Environment;
  /** @member HTMLPreElement */
  canvas: HTMLCanvasElement;
  metrics: Metric[];

  constructor(environment: Environment) {
    this.canvas = document.createElement("canvas");
    this.environment = environment;
    this.metrics = [];
    environment.renderers.push(this);
  }

  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      container.innerHTML = "";
      container.appendChild(this.canvas);
    }
  }

  metric(key: string, opts: MetricOptions = defaultOptions) {
    const buffer = document.createElement("canvas");
    buffer.width = this.canvas.width;
    buffer.height = this.canvas.height;
    this.metrics.push({
      opts.color,
      key,
      buffer,
      location: { x: -1, y: -1 }
    });
  }

  render() {
    const agents = this.environment.getAgents();
    const { time } = this.environment;
    const means: Map<string, number> = new Map();
    agents.forEach(agent => {
      this.metrics.forEach(metric => {
        const { key } = metric;
        const data = agent.get(key);
        if (isNaN(data)) return;
        means.set(key, !means.get(key) ? data : means.get(key) + data);
      });
    });
    this.canvas
      .getContext("2d")
      .clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.metrics.forEach(metric => {
      const { buffer, color, location, key } = metric;
      let { x, y } = location;
      const context = buffer.getContext("2d");
      const mean = means.get(key) / agents.length;

      context.strokeStyle = color;
      if (x < 0) y = this.canvas.height - mean;
      context.moveTo(x, y);
      context.lineTo(x + 1, this.canvas.height - mean);
      context.stroke();
      location.x++;
      location.y = this.canvas.height - mean;

      this.canvas.getContext("2d").drawImage(buffer, 0, 0);
    });
  }
}

export { LineChartRenderer };
