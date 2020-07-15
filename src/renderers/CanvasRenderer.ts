/// <reference path="./Renderer.d.ts" />
/// <reference path="./CanvasRendererOptions.d.ts" />
import { Environment } from "../environments/Environment";
import { Agent } from "../agents/Agent";

const defaultOptions: CanvasRendererOptions = {
  autoPosition: false,
  background: "transparent",
  connectionColor: "black",
  connectionOpacity: 1,
  connectionWidth: 1,
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
  buffer: HTMLCanvasElement;
  /** @member HTMLCanvasElement */
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  terrainBuffer: HTMLCanvasElement = document.createElement("canvas");
  width: number;
  height: number;

  constructor(environment: Environment, opts: CanvasRendererOptions) {
    this.environment = environment;
    environment.renderers.push(this);

    this.opts = Object.assign({}, defaultOptions);
    Object.assign(this.opts, opts);
    const { width, height } = this.opts;

    const dpr = window.devicePixelRatio;
    this.width = width * dpr;
    this.height = height * dpr;

    this.canvas = this.createCanvas();
    this.context = this.canvas.getContext("2d");
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";

    this.buffer = this.createCanvas();
    this.terrainBuffer.width = width;
    this.terrainBuffer.height = height;

    this.context.fillStyle = opts.background;
    this.context.fillRect(0, 0, width, height);
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
    return window.devicePixelRatio * scale * (v - origin.x);
  }

  y(v: number): number {
    const { origin, scale } = this.opts;
    return window.devicePixelRatio * scale * (v - origin.y);
  }

  createCanvas(): HTMLCanvasElement {
    const dpr = window.devicePixelRatio;
    const { width, height } = this.opts;
    const canvas = document.createElement("canvas");
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    return canvas;
  }

  render(): void {
    const {
      buffer,
      context,
      environment,
      width,
      height,
      opts,
      terrainBuffer
    } = this;
    const { trace } = opts;
    const dpr = window.devicePixelRatio;

    // always clear buffer
    const bufferContext = buffer.getContext("2d");
    bufferContext.clearRect(0, 0, width, height);

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

    if (environment.helpers.terrain) {
      const { terrain } = environment.helpers;
      const { scale } = terrain.opts;
      const terrainContext = terrainBuffer.getContext("2d");
      const imageData = new ImageData(
        terrain.data,
        terrain.width * scale,
        terrain.height * scale
      );
      terrainContext.putImageData(imageData, 0, 0);
      context.save();
      context.scale(1 / dpr, 1 / dpr);
      context.drawImage(this.terrainBuffer, 0, 0, width * dpr, height * dpr);
      context.restore();
    }

    // Map of connections that have been drawn between an agent and and its neighbors
    // (check against this in order to not draw connections twice)
    const connectionsDrawn = new Map<Agent, Agent[]>();

    environment.getAgents().forEach(agent => {
      const { x, y, vx, vy, color, shape, size = 1 } = agent.getData();

      context.beginPath();
      context.moveTo(this.x(x), this.y(y));

      bufferContext.beginPath();
      bufferContext.moveTo(this.x(x), this.y(y));

      // always draw connections to other agents directly to the canvas context
      if (this.environment.helpers.network) {
        connectionsDrawn.set(agent, []);
        const { network } = this.environment.helpers;
        if (!network.neighbors(agent)) return;
        for (let neighbor of network.neighbors(agent)) {
          if (connectionsDrawn.get(neighbor)?.includes(agent)) {
            break;
          }

          connectionsDrawn.get(agent).push(neighbor);

          const nx = neighbor.get("x");
          const ny = neighbor.get("y");

          context.save();
          context.beginPath();
          context.globalAlpha = this.opts.connectionOpacity;
          context.strokeStyle = this.opts.connectionColor;
          context.lineWidth = this.opts.connectionWidth;
          context.moveTo(this.x(x), this.x(y));
          context.lineTo(this.x(nx), this.x(ny));
          context.stroke();
          context.closePath();
          context.restore();
        }
      }

      bufferContext.strokeStyle = "none";
      bufferContext.fillStyle = color || "black";

      // draw agents to the buffer, then after finished looping
      // we will draw the buffer to the canvas
      if (shape === "arrow" && vx !== null && vy !== null) {
        const norm = Math.sqrt(vx ** 2 + vy ** 2);
        const _vx = 3 * size * (vx / norm) * dpr;
        const _vy = 3 * size * (vy / norm) * dpr;

        bufferContext.beginPath();

        bufferContext.save();
        bufferContext.translate(this.x(x), this.y(y));
        bufferContext.moveTo(1.5 * _vx, 1.5 * _vy);
        bufferContext.lineTo(_vy / 2, -_vx / 2);
        bufferContext.lineTo(-_vy / 2, _vx / 2);
        bufferContext.restore();
      } else if (shape === "rect") {
        bufferContext.fillRect(
          this.x(x),
          this.y(y),
          (agent.get("width") || 1) * dpr,
          (agent.get("height") || 1) * dpr
        );
      } else {
        bufferContext.arc(this.x(x), this.y(y), size * dpr, 0, 2 * Math.PI);
      }

      bufferContext.fill();
    });

    context.drawImage(buffer, 0, 0);
  }
}

export { CanvasRenderer };
