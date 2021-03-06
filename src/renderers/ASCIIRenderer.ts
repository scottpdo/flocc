import { GridEnvironment } from "../environments/GridEnvironment";
import { Agent } from "../agents/Agent";
import { AbstractRenderer } from "./AbstractRenderer";
import once from "../utils/once";

const warnOnce = once(console.warn.bind(console));

/**
 * An `ASCIIRenderer` renders the {@link Agent | `Agent`}s in
 * a {@linkcode GridEnvironment}. `Agent`s are rendered
 * using their `"value"` data (a single character).
 * Since v0.4.0, this class has been deprecated, and it will be removed
 * entirely in v0.6.0.
 * ```js
 * const renderer = new ASCIIRenderer(grid);
 * renderer.mount("#container-id");
 * ```
 * @deprecated since 0.4.0
 * @since 0.0.10
 */
class ASCIIRenderer extends AbstractRenderer {
  /**
   * @hidden
   * @override
   */
  canvas: null;
  /**
   * @hidden
   * @override
   */
  context: null;
  /**
   * @hidden
   * @override
   */
  width: null;
  /**
   * @hidden
   * @override
   */
  height: null;
  /**
   * Points to the {@linkcode GridEnvironment} that this
   * `ASCIIRenderer` is tied to. This is automatically set when the
   * `ASCIIRenderer` is created.
   */
  environment: GridEnvironment;
  /** @hidden */
  pre: HTMLPreElement;

  /**
   * Create a new `ASCIIRenderer` by passing in the
   * {@linkcode GridEnvironment} you want to be rendered.
   */
  constructor(environment: GridEnvironment) {
    super();

    warnOnce(
      "As of Flocc v0.5.0, ASCIIEnvironment is **DEPRECATED**. It will be **REMOVED** in v0.6.0. The Terrain helper should be used for 2-dimensional grid-like data, with CanvasRenderer to visualize. Read more about Terrains here: https://flocc.network/docs/terrain"
    );

    this.environment = environment;
    environment.renderers.push(this);

    this.pre = document.createElement("pre");
  }

  /**
   * Renders the contents of the `ASCIIRenderer`'s {@linkcode GridEnvironment}.
   * @since 0.0.10
   */
  render() {
    this.pre.innerHTML = "";
    this.environment.loop((x: number, y: number, agent: Agent | null) => {
      let value: string = " ";
      const cell = this.environment.getCell(x, y);
      if (agent && agent.get("value")) {
        value = agent.get("value");
      } else if (cell && cell.get("value")) {
        value = cell.get("value");
      }
      this.pre.innerHTML += value;
      if (x === this.environment.width - 1) this.pre.innerHTML += "\n";
    });
  }
}

export { ASCIIRenderer };
