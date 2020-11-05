import { GridEnvironment } from "../environments/GridEnvironment";
import { Agent } from "../agents/Agent";
import { AbstractRenderer } from "./AbstractRenderer";

class ASCIIRenderer extends AbstractRenderer {
  /** @member GridEnvironment */
  environment: GridEnvironment;
  /** @member HTMLPreElement */
  pre: HTMLPreElement;

  constructor(environment: GridEnvironment, opts: Object = {}) {
    super();

    console.warn(
      "As of Flocc v0.5.0, ASCIIEnvironment is **DEPRECATED**. It will be **REMOVED** in v0.6.0. The Terrain helper should be used for 2-dimensional grid-like data, with CanvasRenderer to visualize. Read more about Terrains here: https://flocc.network/docs/terrain"
    );

    this.environment = environment;
    environment.renderers.push(this);

    this.pre = document.createElement("pre");
  }

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
