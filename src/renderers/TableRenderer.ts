/// <reference path="./Renderer.d.ts" />
import { Environment } from "../environments/Environment";
import { Agent } from "../agents/Agent";

type TableFilter = (agent: Agent) => boolean;

interface TableRendererOptions {
  filter?: TableFilter;
  limit?: number;
  order?: "asc" | "desc";
  precision?: number;
  refresh?: number;
  sortKey?: string;
  type?: "csv" | "table";
}

const defaultTableRendererOptions: TableRendererOptions = {
  filter: null,
  limit: Infinity,
  order: "desc",
  precision: 3,
  refresh: 500,
  sortKey: null,
  type: "table"
};

const precision = (n: number, d: number): number => {
  if (d < 1) return Math.round(n);
  return Math.round(n * 10 ** d) / 10 ** d;
};

const escapeStringQuotes = (s: string): string => `"${s.replace(/"/g, '\\"')}"`;

export class TableRenderer implements Renderer {
  columns: string[];
  environment: Environment;
  lastRendered: number = +new Date();
  opts: TableRendererOptions = Object.assign({}, defaultTableRendererOptions);
  table: Element;

  constructor(environment: Environment, options: TableRendererOptions = {}) {
    this.environment = environment;
    environment.renderers.push(this);

    Object.assign(this.opts, options);
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

  serializeColumns(
    joiner: string,
    start: string = "",
    end: string = "",
    escape: boolean = false
  ): string {
    const columns = escape
      ? this.columns.map(c => escapeStringQuotes(c))
      : this.columns;
    return start + columns.join(joiner) + end;
  }

  serializeRows(
    joiner: string,
    start: string = "",
    end: string = "",
    escape: boolean = false
  ): string {
    const { columns, environment, opts } = this;
    const { filter, limit, order, sortKey } = opts;
    // filter agent data if there is a filter function,
    // otherwise duplicate environment.getAgents() as a new array
    const agents = filter
      ? environment.getAgents().filter(filter)
      : Array.from(environment.getAgents());
    // if there is a sortKey, sort the agents
    if (sortKey !== null) {
      agents.sort((a, b) => {
        const first = order === "asc" ? a : b;
        const second = first === a ? b : a;
        return first.get(sortKey) - second.get(sortKey);
      });
    }
    return agents
      .slice(0, limit)
      .map(agent => {
        return (
          start +
          columns
            .map(key => {
              const v = agent.get(key);
              if (typeof v === "number") {
                return precision(v, this.opts.precision);
                // include double-quotes and escape inner double-quotes
              } else if (typeof v === "string") {
                return escape ? escapeStringQuotes(v) : v;
              }
              return v ? v.toString() : "";
            })
            .join(joiner) +
          end
        );
      })
      .join("");
  }

  renderCSV(): string {
    return (
      this.serializeColumns(",", "", "\n", true) +
      this.serializeRows(",", "", "\n", true)
    );
  }

  renderHTMLTable(): string {
    const thead = this.serializeColumns(
      "</td><td>",
      "<thead><tr><td>",
      "</td></tr></thead>"
    );
    const tbody =
      "<tbody>" +
      this.serializeRows("</td><td>", "<tr><td>", "</td></tr>") +
      "</tbody>";
    return `<table>${thead}${tbody}</table>`;
  }

  render(): void {
    // server
    if (typeof window === "undefined") {
      console.log(this.output());
      // browser
    } else {
      if (+new Date() - this.lastRendered >= this.opts.refresh) {
        this.table.innerHTML = this.output();
        this.lastRendered = +new Date();
      }
    }
  }

  output(): string {
    const { type } = this.opts;
    if (type === "csv") {
      return this.renderCSV();
    } else if (type === "table") {
      return this.renderHTMLTable();
    }
  }
}
