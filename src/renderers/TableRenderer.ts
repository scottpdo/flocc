/// <reference path="./Renderer.d.ts" />
import { Environment } from "../environments/Environment";

interface TableRendererOptions {
  type?: "csv" | "table";
}

const defaultTableRendererOptions: TableRendererOptions = {
  type: "table"
};

export class TableRenderer implements Renderer {
  columns: string[];
  environment: Environment;
  table: Element;
  type: "csv" | "table";

  constructor(environment: Environment, options: TableRendererOptions = {}) {
    this.environment = environment;
    environment.renderers.push(this);

    options = Object.assign(options, defaultTableRendererOptions);
    this.type = options.type;
    this.columns = [];
  }

  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      if (container instanceof HTMLElement) container.style.whiteSpace = "pre";
      container.innerHTML = "";
    }
    this.table = container;
  }

  render(): void {
    const output = this.output();
    // server
    if (typeof window === "undefined") {
      console.log(output);
    } else {
      this.table.innerHTML = output;
    }
  }

  output() {
    const { columns, environment } = this;
    const rows = environment.getAgents().map(agent => {
      return columns.map(key => agent.get(key)).join(",");
    });
    return columns.join(",") + "\n" + rows.join("\n");
  }
}
