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
 *
 * `CanvasRenderer`s will render all `Agent`s that are visible in the rendered `Environment` space,
 * with the color of their `"color"` value (defaulting to black).
 * Depending on the `"shape"` of the `Agent`, additional data might be needed. `Agent` `"shape"`s can be:
 * - `"circle"` (default) &mdash; Draws a circle centered at the `Agent`'s `"x"` / `"y"` values.
 *   - If the `Agent` has a `"size"` value, uses that for the circle radius (defaults to 1px).
 * - `"arrow"` &mdash; Draws an arrow centered at the `Agent`'s `"x"` / `"y"` values.
 *   - The arrow will point in the direction of the `Agent`s `"vx"` / `"vy"` values. For example, an `Agent` with `"vx" = 1` and `"vy" = 0` will be rendered as an arrow pointing to the right.
 *   - Also uses the `"size" value.
 * - `"rect"` &mdash; Draws a rectangle with the upper-left corner at `"x"` / `"y"`.
 *   - Uses the `Agent`'s `"width"` and `"height"` values for the dimensions of the rectangle.
 * - `"triangle"` &mdash; Draws a triangle centered at the `Agent`'s `"x"` / `"y"` values.
 *   - Also uses the `"size"` value.
 *
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

  drawPath(points: [number, number][], dx: number = 0, dy: number = 0): void {
    const bufferContext = this.buffer.getContext("2d");
    points.forEach(([px, py], i) => {
      if (i === 0) {
        bufferContext.moveTo(px + dx, py + dy);
      } else {
        bufferContext.lineTo(px + dx, py + dy);
      }
    });
  }

  drawPathWrap(points: [number, number][]): void {
    const { width, height } = this;

    let right = false;
    let left = false;
    let lower = false;
    let upper = false;

    points.forEach(([px, py]) => {
      if (this.x(px) >= width) right = true;
      if (this.x(px) < 0) left = true;
      if (this.y(py) >= height) lower = true;
      if (this.y(py) < 0) upper = true;
    });

    if (right) this.drawPath(points, -width, 0);
    if (left) this.drawPath(points, width, 0);
    if (lower && right) this.drawPath(points, -width, -height);
    if (upper && right) this.drawPath(points, -width, height);
    if (lower && left) this.drawPath(points, width, -height);
    if (upper && left) this.drawPath(points, width, height);
    if (lower) this.drawPath(points, 0, -height);
    if (upper) this.drawPath(points, 0, height);
  }

  drawCircle(x: number, y: number, r: number): void {
    const bufferContext = this.buffer.getContext("2d");
    bufferContext.moveTo(this.x(x), this.y(y));
    bufferContext.arc(this.x(x), this.y(y), r, 0, 2 * Math.PI);
  }

  drawCircleWrap(x: number, y: number, size: number): void {
    const { width, height } = this;
    if (this.x(x + size) >= width) {
      this.drawCircle(x - width, y, size);
      if (this.y(y + size) >= height)
        this.drawCircle(x - width, y - height, size);
      if (this.y(y - size) < 0) this.drawCircle(x - width, y + height, size);
    }
    if (this.x(x - size) < 0) {
      this.drawCircle(x + width, y, size);
      if (this.y(y + size) >= height)
        this.drawCircle(x + width, y - height, size);
      if (this.y(y - size) < 0) this.drawCircle(x + width, y + height, size);
    }
    if (this.y(y + size) > height) this.drawCircle(x, y - height, size);
    if (this.y(y - size) < 0) this.drawCircle(x, y + height, size);
  }

  /**
   * Draw a rectangle centered at (x, y). Automatically calculates the offset
   * for both width and height.
   * @param x
   * @param y
   * @param width
   * @param height
   */
  drawRect(x: number, y: number, width: number, height: number): void {
    const bufferContext = this.buffer.getContext("2d");
    const dpr = window.devicePixelRatio;
    bufferContext.fillRect(
      this.x(x) - (width * dpr) / 2,
      this.y(y) - (height * dpr) / 2,
      width * dpr,
      height * dpr
    );
  }

  drawRectWrap(x: number, y: number, w: number, h: number): void {
    const { width, height } = this.opts;
    if (this.x(x + w / 2) >= width) {
      this.drawRect(x - width, y, w, h);
      if (this.y(y + h / 2) >= height)
        this.drawRect(x - width, y - height, w, h);
      if (this.y(y - height / 2) < 0)
        this.drawRect(x - width, y + height, w, h);
    }
    if (this.x(x - w / 2) < 0) {
      this.drawRect(x + width, y, w, h);
      if (this.y(y + h / 2) >= height)
        this.drawRect(x + width, y - height, w, h);
      if (this.y(y - height / 2) < 0)
        this.drawRect(x + width, y + height, w, h);
    }
    if (this.y(y + h / 2) > height) this.drawRect(x, y - height, w, h);
    if (this.y(y - height / 2) < 0) this.drawRect(x, y + height, w, h);
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

        const points: [number, number][] = [
          [this.x(x) + 1.5 * _vx, this.y(y) + 1.5 * _vy],
          [this.x(x) + _vy / 2, this.y(y) - _vx / 2],
          [this.x(x) - _vy / 2, this.y(y) + _vx / 2]
        ];

        this.drawPath(points);
        if (environment.opts.torus) this.drawPathWrap(points);
      } else if (shape === "rect") {
        const { width = 1, height = 1 } = agent.getData();
        this.drawRect(x, y, width, height);
        if (environment.opts.torus) this.drawRectWrap(x, y, width, height);
      } else if (shape === "triangle") {
        bufferContext.beginPath();

        const points: [number, number][] = [
          [this.x(x), this.y(y) - size / 2],
          [this.x(x) + size / 2, this.y(y) + size / 2],
          [this.x(x) - size / 2, this.y(y) + size / 2]
        ];

        this.drawPath(points);
        if (environment.opts.torus) this.drawPathWrap(points);
      } else if (shape === "circle" || shape === undefined) {
        this.drawCircle(this.x(x), this.y(y), size * dpr);
        if (environment.opts.torus) this.drawCircleWrap(x, y, size);
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
