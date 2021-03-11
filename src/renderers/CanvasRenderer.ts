/// <reference path="./CanvasRendererOptions.d.ts" />
import { AbstractRenderer } from "./AbstractRenderer";
import type { Environment } from "../environments/Environment";
import type { Agent } from "../agents/Agent";

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

/**
 * A `CanvasRenderer` renders an {@linkcode Environment} spatially in two dimensions.
 * Importantly, it expects that all {@linkcode Agent}s in the `Environment`
 * have numeric `"x"` and `"y"` values associated with them.
 * @since 0.0.11
 */
class CanvasRenderer extends AbstractRenderer {
  /** @hidden */
  opts: CanvasRendererOptions;
  /** @hidden */
  buffer: HTMLCanvasElement;
  /** @hidden */
  terrainBuffer: HTMLCanvasElement = document.createElement("canvas");

  /**
   * The first parameter must be the {@linkcode Environment} that this
   * `CanvasRenderer` will render.
   *
   * The second parameter specifies options, which can include:
   * - `autoPosition` (*boolean* = `false`) &mdash; For `Environment`s using a {@linkcode Network}, whether to automatically position the `Agent`s.
   * - `background` (*string* = `"transparent"`) &mdash; The background color to draw before rendering any `Agent`s.
   * - `connectionColor` (*string* = `"black"`) &mdash; For `Environment`s using a `Network`, the color of lines
   * - `connectionOpacity` (*number* = `1`) &mdash; For `Environment`s using a `Network`, the opacity of lines
   * - `connectionWidth` (*number* = `1`) &mdash; For `Environment`s using a `Network`, the width of lines
   * - `height` (*number* = `500`) &mdash; The height, in pixels, of the canvas on which to render
   * - `origin` (*{ x: number; y: number }* = `{ x: 0, y: 0 }`) &mdash; The coordinate of the upper-left point of the space to be rendered
   * - `scale` (*number* = `1`) &mdash; The scale at which to render (the larger the scale, the smaller the size of the space that is actually rendered)
   * - `trace` (*boolean* = `false`) &mdash; If `true`, the renderer will not clear old drawings, causing the `Agent`s to appear to *trace* their paths across space
   * - `width` (*number* = `500`) &mdash; The width, in pixels, of the canvas on which to render
   */
  constructor(environment: Environment, opts: CanvasRendererOptions) {
    super();

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

  /** @hidden */
  x(v: number): number {
    const { origin, scale } = this.opts;
    return window.devicePixelRatio * scale * (v - origin.x);
  }

  /** @hidden */
  y(v: number): number {
    const { origin, scale } = this.opts;
    return window.devicePixelRatio * scale * (v - origin.y);
  }

  /** @hidden */
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
      const {
        x,
        y,
        vx,
        vy,
        color,
        text,
        textAlign = "center",
        textBaseline = "middle",
        textColor,
        textSize = 12,
        shape,
        size = 1
      } = agent.getData();

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
            continue;
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
        const { width = 1, height = 1 } = agent.getData();
        bufferContext.fillRect(
          this.x(x) - (width * dpr) / 2,
          this.y(y) - (height * dpr) / 2,
          width * dpr,
          height * dpr
        );
      } else if (shape === "triangle") {
        bufferContext.beginPath();

        bufferContext.save();
        bufferContext.translate(this.x(x), this.y(y));
        bufferContext.moveTo(0, -size / 2);
        bufferContext.lineTo(size / 2, size / 2);
        bufferContext.lineTo(-size / 2, size / 2);
        bufferContext.restore();
      } else if (shape === "circle" || shape === undefined) {
        bufferContext.arc(this.x(x), this.y(y), size * dpr, 0, 2 * Math.PI);
      }

      bufferContext.fill();

      if (text) {
        bufferContext.save();
        bufferContext.fillStyle = textColor
          ? textColor
          : color
          ? color
          : "black";
        bufferContext.font = `${textSize}px sans-serif`;
        bufferContext.textAlign = textAlign;
        bufferContext.textBaseline = textBaseline;
        bufferContext.fillText(text, this.x(x), this.y(y));
        bufferContext.restore();
      }
    });

    context.drawImage(buffer, 0, 0);
  }
}

export { CanvasRenderer };
