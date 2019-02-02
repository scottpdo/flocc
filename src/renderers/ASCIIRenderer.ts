/// <reference path="./Renderer.d.ts" />
import { GridEnvironment } from "../environments/GridEnvironment";
import { Agent } from "../agents/Agent";

class ASCIIRenderer implements Renderer {
  /** @member GridEnvironment */
  environment: GridEnvironment;
  /** @member HTMLPreElement */
  pre: HTMLPreElement;

  constructor(environment: GridEnvironment, opts: Object = {}) {
    this.environment = environment;
    environment.renderer = this;

    this.pre = document.createElement("pre");
  }

  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      container.innerHTML = "";
      container.appendChild(this.pre);
    }
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
