import { AbstractRenderer } from "./AbstractRenderer";
import type { Environment } from "../environments/Environment";
import type { Agent } from "../agents/Agent";

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

/**
 * A `TableRenderer` renders an HTML table (for browsers only) or CSV (comma-separated value)
 * representation of {@linkcode Agent} data.
 *
 * ```js
 * for (let i = 0; i < 3; i++) {
 *   environment.addAgent(new Agent({
 *     x: i * 10,
 *     y: i - 2
 *   }));
 * }
 *
 * const renderer = new TableRenderer(environment);
 * renderer.columns = ['x', 'y'];
 * renderer.mount('#container');
 * environment.tick();
 * ```
 *
 * The `TableRenderer` renders:
 *
 * |x   |y   |
 * |----|----|
 * |0   |-2  |
 * |10  |-1  |
 * |20  |0   |
 *
 * @since 0.5.0
 */
export class TableRenderer extends AbstractRenderer {
  /**
   * The `TableRenderer`s `columns` should be an array of the keys of `Agent`
   * data that you want to render.
   *
   * ```js
   * // Suppose Agents in the Environment have data that looks like:
   * // {
   * //   "favor": number,
   * //   "oppose": number,
   * //   "neutral" number
   * // }
   *
   * // order of columns is determined by order in the array
   * renderer.columns = ['neutral', 'favor', 'oppose'];
   * ```
   *
   */
  columns: string[];
  /** @hidden */
  lastRendered: number = +new Date();
  /** @hidden */
  opts: TableRendererOptions = Object.assign({}, defaultTableRendererOptions);
  /** @hidden */
  table: Element;

  /**
   * The first parameter must be the {@linkcode Environment} that this
   * `TableRenderer` will render.
   *
   * The second parameter specifies options, which can include:
   * - `"type"` (`"csv"` | `"table"` = `"table"`) &mdash; Whether to render output in CSV or HTML `<table>` format
   * - `"filter"` &mdash; Include a function (`Agent` => `boolean`) to specify which rows to include in the output. For example, if you only want to include `Agent`s with an x value greater than 100:
   *   ```js
   *   const renderer = new TableRenderer(environment, {
   *     filter: agent => {
   *       return agent.get('x') > 100;
   *     }
   *   });
   *   ```
   * - `"limit"` (*number* = `Infinity`) &mdash; The maximum number of rows (`Agent`s) to render. If using a `filter` function, applies the `limit` *after* filtering.
   * - `"sortKey"` (*string* = `null`) &mdash; Sort the `Agent` data by this key of data
   * - `"order"` (`"asc"` | `"desc"` = `"desc"`) &mdash; When using a `"sortKey"`, specify whether `Agent`s should be listed in *asc*ending or *desc*ending order
   * - `"precision"` (*number* = `3`) &mdash; For floating point values, the number of decimal places to display
   * - `"refresh"` (*number* = `500`) &mdash; The number of milliseconds that should elapse between re-rendering (if this happens too quickly the effect can be visually jarring)
   */
  constructor(environment: Environment, options: TableRendererOptions = {}) {
    super();
    this.environment = environment;
    environment.renderers.push(this);

    Object.assign(this.opts, options);
    this.columns = [];
  }

  /**
   * Mount this renderer to a DOM element. Pass either a string representing a
   * CSS selector matching the element or the element itself.
   *
   * ```js
   * // mounts the renderer to the element with the ID `container`
   * renderer.mount('#container');
   *
   * // mounts the renderer to the element itself
   * const container = document.getElementById('container');
   * renderer.mount(container);
   * ```
   * @override
   * @param {string | HTMLElement} el
   */
  mount(el: string | HTMLElement): void {
    const container = typeof el === "string" ? document.querySelector(el) : el;
    if (container) {
      if (container instanceof HTMLElement) container.style.whiteSpace = "pre";
      container.innerHTML = "";
    }
    this.table = container;
  }

  /** @hidden */
  serializeColumns(
    joiner: string,
    start: string = "",
    end: string = "",
    escape: boolean = false
  ): string {
    const columns = escape
      ? this.columns.map(c => escapeStringQuotes(c))
      : this.columns;
    if (columns.length === 0) return "";
    return start + columns.join(joiner) + end;
  }

  /** @hidden */
  serializeRows(
    cellJoiner: string,
    rowJoiner: string,
    start: string = "",
    end: string = "",
    rowStart: string = "",
    rowEnd: string = "",
    escape: boolean = false
  ): string {
    const { columns, environment, opts } = this;
    const { filter, limit, order, sortKey } = opts;

    // if no agents, don't return anything
    if (environment.getAgents().length === 0) return "";

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
    return (
      start +
      agents
        .slice(0, limit)
        .map(agent => {
          return (
            rowStart +
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
              .join(cellJoiner) +
            rowEnd
          );
        })
        .join(rowJoiner) +
      end
    );
  }

  /** @hidden */
  renderCSV(): string {
    const columns = this.serializeColumns(",", "", "", true);
    if (columns === "") return "";
    const rows = this.serializeRows(",", "\n", "", "", "", "", true);
    if (rows === "") return columns;
    return columns + "\n" + rows;
  }

  /** @hidden */
  renderHTMLTable(): string {
    const thead = this.serializeColumns(
      "</td><td>",
      "<thead><tr><td>",
      "</td></tr></thead>"
    );
    const tbody = this.serializeRows(
      "</td><td>",
      "",
      "<tbody>",
      "</tbody>",
      "<tr><td>",
      "</td></tr>"
    );
    return `<table>${thead}${tbody}</table>`;
  }

  /**
   * Returns the outer HTML of the table or the CSV data as a string. This can be useful for exporting data, particularly in a Node.js environment as opposed to in a browser. For instance, in a Node.js script, you could write the CSV data to a file as follows:
   *
   * ```js
   * const fs = require('fs'); // import the file system module
   *
   * const environment = new Environment();
   * for (let i = 0; i < 3; i++) environment.addAgent(new Agent({ i }));
   *
   * const renderer = new TableRenderer(environment, { type: 'csv' });
   * renderer.columns = ['i'];
   *
   * // write the TableRenderer's output to a CSV file named data.csv
   * fs.writeFileSync('./data.csv', renderer.output());
   * ```
   *
   * @since 0.5.0
   */
  output(): string {
    const { type } = this.opts;
    if (type === "csv") {
      return this.renderCSV();
    } else if (type === "table") {
      return this.renderHTMLTable();
    }
  }

  render(): void {
    if (typeof window === "undefined") {
      // server: don't automatically write anything
      return;
    }

    // browser
    if (+new Date() - this.lastRendered >= this.opts.refresh) {
      this.table.innerHTML = this.output();
      this.lastRendered = +new Date();
    }
  }
}
