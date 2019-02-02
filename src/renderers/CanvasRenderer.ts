/// <reference path="./Renderer.d.ts" />
/// <reference path="./CanvasRendererOptions.d.ts" />
import { Environment } from "../environments/Environment";

class CanvasRenderer implements Renderer {
  /** @member Environment */
  environment: Environment;
  opts: CanvasRendererOptions;
  /** @member HTMLCanvasElement */
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(
    environment: Environment,
    opts: CanvasRendererOptions = {
      width: 500,
      height: 500,
      trace: false
    }
  ) {
    this.environment = environment;
    environment.renderer = this;

    this.opts = opts;

    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");

    this.width = opts.width;
    this.height = opts.height;

    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      container.innerHTML = "";
      container.appendChild(this.canvas);
    }
  }

  render(): void {
    const { context, environment, width, height } = this;

    // if "trace" is truthy, don't clear the canvas with every frame
    // to trace the paths of agents
    if (!this.opts.trace) context.clearRect(0, 0, width, height);

    environment.getAgents().forEach(agent => {
      const { x, y, vx, vy, color, shape, size = 1 } = agent.getData();

      context.beginPath();
      context.moveTo(x, y);

      context.fillStyle = color || "black";

      if (shape === "arrow" && vx !== null && vy !== null) {
        const norm = Math.sqrt(vx ** 2 + vy ** 2);
        const _vx = 3 * size * (vx / norm);
        const _vy = 3 * size * (vy / norm);

        context.beginPath();

        context.moveTo(x + 1.5 * _vx, y + 1.5 * _vy);
        context.lineTo(x + _vy / 2, y - _vx / 2);
        context.lineTo(x - _vy / 2, y + _vx / 2);
      } else {
        context.arc(x, y, size, 0, 2 * Math.PI);
      }

      context.fill();
    });
  }
}

export { CanvasRenderer };
