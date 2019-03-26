/// <reference path="./Renderer.d.ts" />
/// <reference path="./CanvasRendererOptions.d.ts" />
import { Environment } from "../environments/Environment";
import { Network } from "../helpers/Network";

const defaultOptions: CanvasRendererOptions = {
  autoPosition: false,
  width: 500,
  height: 500,
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
    environment.renderer = this;

    this.opts = Object.assign(defaultOptions, opts);

    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");

    this.width = this.opts.width;
    this.height = this.opts.height;

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

    // automatically position agents in an environment that uses a network helper
    if (this.opts.autoPosition && this.environment.helpers.network) {
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
      const { x, y, vx, vy, color, shape, size = 1 } = agent.getData();

      context.beginPath();
      context.moveTo(x, y);

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
