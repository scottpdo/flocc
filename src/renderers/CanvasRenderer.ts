/// <reference path="./Renderer.d.ts" />
/// <reference path="./CanvasRendererOptions.d.ts" />
import { Environment } from "../environments/Environment";

const defaultOptions: CanvasRendererOptions = {
  autoPosition: false,
  background: "transparent",
  origin: { x: 0, y: 0 },
  width: 500,
  height: 500,
  scale: 1,
  trace: false
};

class CanvasRenderer implements Renderer {
  /** @member Environment */
  environment: Environment;
  opts: CanvasRendererOptions;
  /** @member HTMLCanvasElement */
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(environment: Environment, opts: CanvasRendererOptions) {
    this.environment = environment;
    environment.renderers.push(this);

    this.opts = Object.assign({}, defaultOptions, opts);
    const { width, height } = this.opts;

    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");

    const dpr = window.devicePixelRatio;
    this.width = width * dpr;
    this.height = height * dpr;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";

    const context = this.canvas.getContext("2d");
    context.fillStyle = opts.background;
    context.fillRect(0, 0, width, height);
  }

  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      container.innerHTML = "";
      container.appendChild(this.canvas);
    }
  }

  x(v: number): number {
    const { origin, scale } = this.opts;
    return scale * v - origin.x;
  }

  y(v: number): number {
    const { origin, scale } = this.opts;
    return scale * v - origin.x;
  }

  render(): void {
    const { context, environment, width, height, opts } = this;
    const { trace } = opts;
    const dpr = window.devicePixelRatio;

    // if "trace" is truthy, don't clear the canvas with every frame
    // to trace the paths of agents
    if (!trace) {
      context.clearRect(0, 0, width * dpr, height * dpr);
      context.fillStyle = opts.background;
      context.fillRect(0, 0, width * dpr, height * dpr);
    }

    // automatically position agents in an environment that uses a network helper
    if (opts.autoPosition && environment.helpers.network) {
      environment.getAgents().forEach(agent => {
        const { network } = this.environment.helpers;
        const { width, height } = this;

        // only set once
        if (
          (agent.get("x") === null || agent.get("y") === null) &&
          network.isInNetwork(agent)
        ) {
          const idx = network.indexOf(agent);
          const angle = idx / network.agents.length;
          const x = width / 2 + 0.4 * width * Math.cos(2 * Math.PI * angle);
          const y = height / 2 + 0.4 * height * Math.sin(2 * Math.PI * angle);
          agent.set({ x, y });
        }
      });
    }

    const connectionsDrawn = new Map();

    environment.getAgents().forEach(agent => {
      let { x, y, vx, vy, color, shape, size = 1 } = agent.getData();

      if (!(opts.autoPosition && environment.helpers.network)) {
        x *= dpr;
        y *= dpr;
      }

      context.beginPath();
      context.moveTo(this.x(x), this.y(y));

      // always draw connections to other agents
      if (this.environment.helpers.network) {
        const { network } = this.environment.helpers;
        for (let neighbor of network.neighbors(agent)) {
          if (
            connectionsDrawn.get(agent) === neighbor ||
            connectionsDrawn.get(neighbor) === agent
          ) {
            break;
          }

          connectionsDrawn.set(agent, neighbor);
          connectionsDrawn.set(neighbor, agent);

          context.beginPath();
          context.strokeStyle = "black";
          context.moveTo(x, y);
          context.lineTo(neighbor.get("x"), neighbor.get("y"));
          context.stroke();
          context.moveTo(x, y);
        }
      }

      context.strokeStyle = "none";
      context.fillStyle = color || "black";

      if (shape === "arrow" && vx !== null && vy !== null) {
        const norm = Math.sqrt(vx ** 2 + vy ** 2);
        const _vx = 3 * size * (vx / norm) * dpr;
        const _vy = 3 * size * (vy / norm) * dpr;

        context.beginPath();

        context.save();
        context.translate(this.x(x), this.y(y));
        context.moveTo(1.5 * _vx, 1.5 * _vy);
        context.lineTo(_vy / 2, -_vx / 2);
        context.lineTo(-_vy / 2, _vx / 2);
        context.restore();
      } else if (shape === "rect") {
        context.fillRect(
          this.x(x),
          this.y(y),
          (agent.get("width") || 1) * dpr,
          (agent.get("height") || 1) * dpr
        );
      } else {
        context.arc(this.x(x), this.y(y), size * dpr, 0, 2 * Math.PI);
      }

      context.fill();
    });
  }
}

export { CanvasRenderer };
