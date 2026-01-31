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
  trace: false,
  interactive: false,
  zoomMin: 0.1,
  zoomMax: 10
};

/** @hidden */
type InteractiveEventName = "click" | "hover" | "unhover";

/** @hidden */
type InteractiveCallback = (agent: Agent, event: MouseEvent) => void;

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
 * When `interactive` is set to `true` in the options, the renderer supports:
 * - **Click/hover detection** &mdash; Use {@linkcode on} to listen for `"click"`, `"hover"`, and `"unhover"` events on agents.
 * - **Agent selection** &mdash; Clicking an agent selects it (highlighted with a stroke). Access selected agents via {@linkcode selected}.
 * - **Pan** &mdash; Click and drag on empty space to pan.
 * - **Zoom** &mdash; Scroll to zoom in/out (bounded by `zoomMin` / `zoomMax`).
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

  /** The currently selected agents (only used when `interactive` is `true`). */
  selected: Agent[] = [];

  /** @hidden */
  private _listeners: Map<InteractiveEventName, InteractiveCallback[]> = new Map();
  /** @hidden */
  private _hoveredAgent: Agent | null = null;
  /** @hidden */
  private _isPanning: boolean = false;
  /** @hidden */
  private _panStart: { x: number; y: number } | null = null;
  /** @hidden */
  private _panOriginStart: { x: number; y: number } | null = null;
  /** @hidden */
  private _boundHandlers: {
    mousedown?: (e: MouseEvent) => void;
    mousemove?: (e: MouseEvent) => void;
    mouseup?: (e: MouseEvent) => void;
    wheel?: (e: WheelEvent) => void;
  } = {};

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
   * - `interactive` (*boolean* = `false`) &mdash; Enables interactive features (click/hover detection, selection, pan, zoom)
   * - `onSelect` (*function*) &mdash; Optional callback when an agent is selected or deselected
   * - `origin` (*{ x: number; y: number }* = `{ x: 0, y: 0 }`) &mdash; The coordinate of the upper-left point of the space to be rendered
   * - `scale` (*number* = `1`) &mdash; The scale at which to render (the larger the scale, the smaller the size of the space that is actually rendered)
   * - `trace` (*boolean* = `false`) &mdash; If `true`, the renderer will not clear old drawings, causing the `Agent`s to appear to *trace* their paths across space
   * - `width` (*number* = `500`) &mdash; The width, in pixels, of the canvas on which to render
   * - `zoomMin` (*number* = `0.1`) &mdash; Minimum scale when zooming
   * - `zoomMax` (*number* = `10`) &mdash; Maximum scale when zooming
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
    this.context.fillRect(0, 0, this.width, this.height);

    if (this.opts.interactive) {
      this._setupInteractiveListeners();
    }
  }

  /**
   * Register a callback for an interactive event.
   * Supported event names: `"click"`, `"hover"`, `"unhover"`.
   *
   * ```js
   * renderer.on("click", (agent, event) => {
   *   console.log("Clicked agent:", agent.id);
   * });
   * ```
   *
   * @param eventName - The event to listen for.
   * @param callback - The callback, invoked with the `Agent` and the `MouseEvent`.
   */
  on(eventName: InteractiveEventName, callback: InteractiveCallback): void {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, []);
    }
    this._listeners.get(eventName).push(callback);
  }

  /** @hidden */
  private _emit(eventName: InteractiveEventName, agent: Agent, event: MouseEvent): void {
    const callbacks = this._listeners.get(eventName);
    if (callbacks) {
      callbacks.forEach(cb => cb(agent, event));
    }
  }

  /**
   * Given a mouse event, return the agent at that position (if any).
   * Hit-testing accounts for the agent's shape and size.
   * @hidden
   */
  _agentAtPoint(clientX: number, clientY: number): Agent | null {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    const canvasX = (clientX - rect.left) * dpr;
    const canvasY = (clientY - rect.top) * dpr;

    const agents = this.environment.getAgents();
    // Iterate in reverse so topmost-drawn agent is found first
    for (let i = agents.length - 1; i >= 0; i--) {
      const agent = agents[i];
      const data = agent.getData();
      const ax = this.x(data.x);
      const ay = this.y(data.y);
      const shape = data.shape;
      const size = (data.size || 1) * dpr;

      if (shape === "rect") {
        const w = (data.width || 1) * dpr;
        const h = (data.height || 1) * dpr;
        const rx = ax - w / 2;
        const ry = ay - h / 2;
        if (canvasX >= rx && canvasX <= rx + w && canvasY >= ry && canvasY <= ry + h) {
          return agent;
        }
      } else if (shape === "triangle") {
        // Simple bounding-box hit test for triangles
        const halfSize = size / 2;
        if (
          canvasX >= ax - halfSize &&
          canvasX <= ax + halfSize &&
          canvasY >= ay - halfSize &&
          canvasY <= ay + halfSize
        ) {
          return agent;
        }
      } else {
        // Default: circle (and arrow) — distance-based hit test
        const dx = canvasX - ax;
        const dy = canvasY - ay;
        const hitRadius = Math.max(size, 4 * dpr); // minimum hit area for tiny agents
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          return agent;
        }
      }
    }

    return null;
  }

  /** @hidden */
  private _setupInteractiveListeners(): void {
    const onMouseDown = (e: MouseEvent) => {
      const agent = this._agentAtPoint(e.clientX, e.clientY);
      if (agent) {
        // Agent click — select it
        this.selected = [agent];
        if (this.opts.onSelect) this.opts.onSelect(agent);
        this._emit("click", agent, e);
        this.render();
      } else {
        // Empty space — deselect and start panning
        if (this.selected.length > 0) {
          this.selected = [];
          if (this.opts.onSelect) this.opts.onSelect(null);
          this.render();
        }
        this._isPanning = true;
        this._panStart = { x: e.clientX, y: e.clientY };
        this._panOriginStart = { x: this.opts.origin.x, y: this.opts.origin.y };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (this._isPanning && this._panStart && this._panOriginStart) {
        const dpr = window.devicePixelRatio;
        const dx = e.clientX - this._panStart.x;
        const dy = e.clientY - this._panStart.y;
        this.opts.origin = {
          x: this._panOriginStart.x - dx / (this.opts.scale * dpr),
          y: this._panOriginStart.y - dy / (this.opts.scale * dpr)
        };
        this.render();
        return;
      }

      // Hover detection
      const agent = this._agentAtPoint(e.clientX, e.clientY);
      if (agent !== this._hoveredAgent) {
        if (this._hoveredAgent) {
          this._emit("unhover", this._hoveredAgent, e);
        }
        if (agent) {
          this._emit("hover", agent, e);
        }
        this._hoveredAgent = agent;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      this._isPanning = false;
      this._panStart = null;
      this._panOriginStart = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoomMin, zoomMax } = this.opts;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      let newScale = this.opts.scale * delta;
      newScale = Math.max(zoomMin, Math.min(zoomMax, newScale));
      this.opts.scale = newScale;
      this.render();
    };

    this._boundHandlers = { mousedown: onMouseDown, mousemove: onMouseMove, mouseup: onMouseUp, wheel: onWheel };

    this.canvas.addEventListener("mousedown", onMouseDown);
    this.canvas.addEventListener("mousemove", onMouseMove);
    this.canvas.addEventListener("mouseup", onMouseUp);
    this.canvas.addEventListener("wheel", onWheel, { passive: false });
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

  /** @hidden */
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

  /** @hidden */
  drawPathWrap(points: [number, number][]): void {
    const { width, height } = this;

    let right = false;
    let left = false;
    let lower = false;
    let upper = false;

    // points are already in DPR-scaled pixel space, so compare directly
    points.forEach(([px, py]) => {
      if (px >= width) right = true;
      if (px < 0) left = true;
      if (py >= height) lower = true;
      if (py < 0) upper = true;
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

  /** @hidden */
  drawCircle(x: number, y: number, r: number): void {
    const bufferContext = this.buffer.getContext("2d");
    bufferContext.moveTo(this.x(x), this.y(y));
    bufferContext.arc(this.x(x), this.y(y), r, 0, 2 * Math.PI);
  }

  /** @hidden */
  drawCircleWrap(x: number, y: number, size: number): void {
    const { width, height } = this;
    const worldWidth = this.opts.width;
    const worldHeight = this.opts.height;
    if (this.x(x + size) >= width) {
      this.drawCircle(x - worldWidth, y, size);
      if (this.y(y + size) >= height)
        this.drawCircle(x - worldWidth, y - worldHeight, size);
      if (this.y(y - size) < 0) this.drawCircle(x - worldWidth, y + worldHeight, size);
    }
    if (this.x(x - size) < 0) {
      this.drawCircle(x + worldWidth, y, size);
      if (this.y(y + size) >= height)
        this.drawCircle(x + worldWidth, y - worldHeight, size);
      if (this.y(y - size) < 0) this.drawCircle(x + worldWidth, y + worldHeight, size);
    }
    if (this.y(y + size) > height) this.drawCircle(x, y - worldHeight, size);
    if (this.y(y - size) < 0) this.drawCircle(x, y + worldHeight, size);
  }

  /**
   * Draw a rectangle centered at (x, y). Automatically calculates the offset
   * for both width and height.
   * @hidden
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

  /** @hidden */
  drawRectWrap(x: number, y: number, w: number, h: number): void {
    const { width, height } = this;
    const worldWidth = this.opts.width;
    const worldHeight = this.opts.height;
    if (this.x(x + w / 2) >= width) {
      this.drawRect(x - worldWidth, y, w, h);
      if (this.y(y + h / 2) >= height)
        this.drawRect(x - worldWidth, y - worldHeight, w, h);
      if (this.y(y - h / 2) < 0)
        this.drawRect(x - worldWidth, y + worldHeight, w, h);
    }
    if (this.x(x - w / 2) < 0) {
      this.drawRect(x + worldWidth, y, w, h);
      if (this.y(y + h / 2) >= height)
        this.drawRect(x + worldWidth, y - worldHeight, w, h);
      if (this.y(y - h / 2) < 0)
        this.drawRect(x + worldWidth, y + worldHeight, w, h);
    }
    if (this.y(y + h / 2) > height) this.drawRect(x, y - worldHeight, w, h);
    if (this.y(y - h / 2) < 0) this.drawRect(x, y + worldHeight, w, h);
  }

  /**
   * Draw a selection highlight around the given agent.
   * @hidden
   */
  private _drawSelectionHighlight(agent: Agent): void {
    const bufferContext = this.buffer.getContext("2d");
    const dpr = window.devicePixelRatio;
    const data = agent.getData();
    const ax = this.x(data.x);
    const ay = this.y(data.y);
    const shape = data.shape;
    const size = (data.size || 1) * dpr;

    bufferContext.save();
    bufferContext.strokeStyle = "#0af";
    bufferContext.lineWidth = 2 * dpr;

    if (shape === "rect") {
      const w = (data.width || 1) * dpr;
      const h = (data.height || 1) * dpr;
      bufferContext.strokeRect(
        ax - w / 2 - 2 * dpr,
        ay - h / 2 - 2 * dpr,
        w + 4 * dpr,
        h + 4 * dpr
      );
    } else {
      bufferContext.beginPath();
      const highlightRadius = Math.max(size, 4 * dpr) + 3 * dpr;
      bufferContext.arc(ax, ay, highlightRadius, 0, 2 * Math.PI);
      bufferContext.stroke();
    }

    bufferContext.restore();
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
      context.clearRect(0, 0, width, height);
      context.fillStyle = opts.background;
      context.fillRect(0, 0, width, height);
    }

    // automatically position agents in an environment that uses a network helper
    if (opts.autoPosition && environment.helpers.network) {
      environment.getAgents().forEach(agent => {
        const { network } = this.environment.helpers;
        // Use CSS pixel dimensions (opts), not the DPI-scaled canvas dimensions,
        // since x() and y() already apply the devicePixelRatio transform.
        const { width: w, height: h } = this.opts;

        // only set once
        if (
          (agent.get("x") === null || agent.get("y") === null) &&
          network.isInNetwork(agent)
        ) {
          const idx = network.indexOf(agent);
          const angle = idx / network.agents.length;
          const x = w / 2 + 0.4 * w * Math.cos(2 * Math.PI * angle);
          const y = h / 2 + 0.4 * h * Math.sin(2 * Math.PI * angle);
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
          context.moveTo(this.x(x), this.y(y));
          context.lineTo(this.x(nx), this.y(ny));
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

        const scaledSize = size * dpr;
        const points: [number, number][] = [
          [this.x(x), this.y(y) - scaledSize / 2],
          [this.x(x) + scaledSize / 2, this.y(y) + scaledSize / 2],
          [this.x(x) - scaledSize / 2, this.y(y) + scaledSize / 2]
        ];

        this.drawPath(points);
        if (environment.opts.torus) this.drawPathWrap(points);
      } else if (shape === "circle" || shape === undefined) {
        this.drawCircle(x, y, size * dpr);
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

    // Draw selection highlights for selected agents
    if (opts.interactive && this.selected.length > 0) {
      this.selected.forEach(agent => {
        this._drawSelectionHighlight(agent);
      });
    }

    context.drawImage(buffer, 0, 0);
  }
}

export { CanvasRenderer };
