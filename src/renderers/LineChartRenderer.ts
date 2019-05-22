/// <reference path="./Renderer.d.ts" />
import { Environment } from "../environments/Environment";
import { Agent } from "../agents/Agent";

class LineChartRenderer implements Renderer {
  /** @member Environment */
  environment: Environment;
  /** @member HTMLPreElement */
  canvas: HTMLCanvasElement;
  metrics: Object;

  constructor(environment: Environment, opts = {}) {
    this.canvas = document.createElement("canvas");
    this.environment = environment;
    this.metrics = {};
    environment.renderers.push(this);
  }

  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      container.innerHTML = "";
      container.appendChild(this.canvas);
    }
  }

  metric(key: string, opts = {}) {
    console.log("setting linechart metric", key);
    this.metrics[key] = {};
  }

  render() {}
}

export { LineChartRenderer };
