import type { Environment } from "../environments/Environment";
import type { Agent } from "../agents/Agent";

/**
 * Model-level metric function: receives environment, returns a value.
 */
type ModelMetric<T = any> = (env: Environment) => T;

/**
 * Agent-level metric function: receives agent, returns a value.
 */
type AgentMetric<T = any> = (agent: Agent) => T;

/**
 * Configuration options for the Recorder.
 */
interface RecorderOptions {
  /**
   * Model-level metrics to record. Each key is a metric name,
   * and the value is a function that computes the metric from the environment.
   *
   * @example
   * ```js
   * model: {
   *   population: (env) => env.getAgents().length,
   *   avgEnergy: (env) => utils.mean(env.stat('energy')),
   * }
   * ```
   */
  model?: Record<string, ModelMetric>;

  /**
   * Agent-level metrics to record. Each key is a metric name,
   * and the value is a function that computes the metric from each agent.
   * Disabled by default since it can generate large datasets.
   *
   * @example
   * ```js
   * agent: {
   *   id: (agent) => agent.id,
   *   x: (agent) => agent.get('x'),
   *   energy: (agent) => agent.get('energy'),
   * }
   * ```
   */
  agent?: Record<string, AgentMetric>;

  /**
   * When to collect data:
   * - `'tick'`: every tick (default)
   * - `'manual'`: only when `recorder.record()` is called
   * - `number`: every N ticks
   */
  interval?: "tick" | "manual" | number;

  /**
   * Optional filter for which agents to record (only applies if agent metrics defined).
   *
   * @example
   * ```js
   * agentFilter: (agent) => agent.get('type') === 'prey'
   * ```
   */
  agentFilter?: (agent: Agent) => boolean;
}

/**
 * Recorded model data: time array plus arrays for each metric.
 */
interface ModelData {
  time: number[];
  [key: string]: number[] | any[];
}

/**
 * Single agent data record.
 */
interface AgentDataRecord {
  time: number;
  [key: string]: any;
}

/**
 * Records data from a simulation run. Can be used standalone for interactive
 * exploration or internally by `Experiment` for batch runs.
 *
 * @example
 * ```js
 * const recorder = new Recorder(environment, {
 *   model: {
 *     population: (env) => env.getAgents().length,
 *     avgEnergy: (env) => utils.mean(env.stat('energy')),
 *   },
 *   interval: 'tick',
 * });
 *
 * // Run simulation
 * for (let i = 0; i < 100; i++) {
 *   environment.tick();
 * }
 *
 * // Access data
 * console.log(recorder.getModelData());
 * console.log(recorder.toCSV());
 * ```
 *
 * @since 0.7.0
 */
class Recorder {
  private environment: Environment;
  private modelMetrics: Record<string, ModelMetric>;
  private agentMetrics: Record<string, AgentMetric> | null;
  private interval: "tick" | "manual" | number;
  private agentFilter: ((agent: Agent) => boolean) | null;

  private modelData: ModelData;
  private agentData: AgentDataRecord[];

  private lastRecordedTime: number = -1;
  private unsubscribe: (() => void) | null = null;
  private hasWarnedDuplicate: boolean = false;

  /**
   * Create a new Recorder attached to an environment.
   *
   * @param environment - The environment to record from
   * @param options - Configuration options
   */
  constructor(environment: Environment, options: RecorderOptions = {}) {
    this.environment = environment;
    this.modelMetrics = options.model ?? {};
    this.agentMetrics = options.agent ?? null;
    this.interval = options.interval ?? "tick";
    this.agentFilter = options.agentFilter ?? null;

    // Initialize data storage
    this.modelData = { time: [] };
    for (const key of Object.keys(this.modelMetrics)) {
      this.modelData[key] = [];
    }
    this.agentData = [];

    // Auto-subscribe to tick:end if interval is not 'manual'
    if (this.interval !== "manual") {
      this.subscribeToTicks();
    }
  }

  /**
   * Subscribe to environment tick events for automatic recording.
   * @hidden
   */
  private subscribeToTicks(): void {
    let tickCounter = 0;

    this.unsubscribe = this.environment.events.on("tick:end", () => {
      tickCounter++;

      if (this.interval === "tick") {
        this.record();
      } else if (typeof this.interval === "number") {
        if (tickCounter % this.interval === 0) {
          this.record();
        }
      }
    });
  }

  /**
   * Record data for the current tick. If called multiple times per tick,
   * subsequent calls are ignored with a warning.
   */
  record(): void {
    const currentTime = this.environment.time;

    // Prevent recording multiple times per tick
    if (currentTime === this.lastRecordedTime) {
      if (!this.hasWarnedDuplicate) {
        console.warn(
          `Recorder.record() called multiple times for tick ${currentTime}. ` +
            `Only the first call is recorded.`
        );
        this.hasWarnedDuplicate = true;
      }
      return;
    }

    this.lastRecordedTime = currentTime;

    // Record model-level metrics
    this.modelData.time.push(currentTime);
    for (const [key, metric] of Object.entries(this.modelMetrics)) {
      try {
        const value = metric(this.environment);
        (this.modelData[key] as any[]).push(value);
      } catch (error) {
        console.error(`Error computing model metric "${key}":`, error);
        (this.modelData[key] as any[]).push(null);
      }
    }

    // Record agent-level metrics if configured
    if (this.agentMetrics) {
      const agents = this.environment.getAgents();
      const filteredAgents = this.agentFilter
        ? agents.filter(this.agentFilter)
        : agents;

      for (const agent of filteredAgents) {
        const record: AgentDataRecord = { time: currentTime };

        for (const [key, metric] of Object.entries(this.agentMetrics)) {
          try {
            record[key] = metric(agent);
          } catch (error) {
            console.error(
              `Error computing agent metric "${key}" for agent ${agent.id}:`,
              error
            );
            record[key] = null;
          }
        }

        this.agentData.push(record);
      }
    }
  }

  /**
   * Get all recorded model-level data.
   *
   * @returns Object with `time` array and arrays for each metric
   *
   * @example
   * ```js
   * recorder.getModelData();
   * // Returns: {
   * //   time: [0, 1, 2, 3, ...],
   * //   population: [100, 102, 98, 103, ...],
   * //   avgEnergy: [50.2, 49.8, 51.1, ...],
   * // }
   * ```
   */
  getModelData(): ModelData {
    return this.modelData;
  }

  /**
   * Get all recorded agent-level data.
   *
   * @returns Array of agent data records
   *
   * @example
   * ```js
   * recorder.getAgentData();
   * // Returns: [
   * //   { time: 0, id: 'abc', x: 10, energy: 50 },
   * //   { time: 0, id: 'def', x: 15, energy: 45 },
   * //   { time: 1, id: 'abc', x: 11, energy: 48 },
   * //   ...
   * // ]
   * ```
   */
  getAgentData(): AgentDataRecord[] {
    return this.agentData;
  }

  /**
   * Get a specific model metric's recorded values.
   *
   * @param name - The metric name
   * @returns Array of values, or undefined if metric doesn't exist
   */
  getMetric(name: string): any[] | undefined {
    if (name === "time") {
      return this.modelData.time;
    }
    return this.modelData[name] as any[] | undefined;
  }

  /**
   * Get the most recently recorded values.
   *
   * @returns Object with time and latest value for each metric
   */
  latest(): Record<string, any> | null {
    if (this.modelData.time.length === 0) {
      return null;
    }

    const lastIndex = this.modelData.time.length - 1;
    const result: Record<string, any> = {
      time: this.modelData.time[lastIndex],
    };

    for (const key of Object.keys(this.modelMetrics)) {
      result[key] = (this.modelData[key] as any[])[lastIndex];
    }

    return result;
  }

  /**
   * Reset the recorder, clearing all collected data.
   */
  reset(): void {
    this.modelData = { time: [] };
    for (const key of Object.keys(this.modelMetrics)) {
      this.modelData[key] = [];
    }
    this.agentData = [];
    this.lastRecordedTime = -1;
  }

  /**
   * Convert recorded data to CSV string.
   *
   * @param type - Which data to export: `'model'` (default) or `'agent'`
   * @returns CSV string
   */
  toCSV(type: "model" | "agent" = "model"): string {
    if (type === "agent") {
      return this.agentDataToCSV();
    }
    return this.modelDataToCSV();
  }

  /**
   * Convert recorded data to JSON object.
   *
   * @param type - Which data to export: `'model'` (default) or `'agent'`
   * @returns Data object
   */
  toJSON(type: "model" | "agent" = "model"): ModelData | AgentDataRecord[] {
    if (type === "agent") {
      return this.agentData;
    }
    return this.modelData;
  }

  /**
   * Convert model data to CSV.
   * @hidden
   */
  private modelDataToCSV(): string {
    const keys = ["time", ...Object.keys(this.modelMetrics)];
    const rows: string[] = [];

    // Header row
    rows.push(keys.join(","));

    // Data rows
    const numRows = this.modelData.time.length;
    for (let i = 0; i < numRows; i++) {
      const row = keys.map((key) => {
        const value = (this.modelData[key] as any[])[i];
        return this.formatCSVValue(value);
      });
      rows.push(row.join(","));
    }

    return rows.join("\n");
  }

  /**
   * Convert agent data to CSV.
   * @hidden
   */
  private agentDataToCSV(): string {
    if (this.agentData.length === 0) {
      return "";
    }

    // Get all keys from first record (assumes consistent schema)
    const keys = Object.keys(this.agentData[0]);
    const rows: string[] = [];

    // Header row
    rows.push(keys.join(","));

    // Data rows
    for (const record of this.agentData) {
      const row = keys.map((key) => this.formatCSVValue(record[key]));
      rows.push(row.join(","));
    }

    return rows.join("\n");
  }

  /**
   * Format a value for CSV output.
   * @hidden
   */
  private formatCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "string") {
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    // For objects/arrays, stringify
    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  }

  /**
   * Detach the recorder from the environment (stop auto-recording).
   */
  detach(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export { Recorder, RecorderOptions, ModelMetric, AgentMetric, ModelData, AgentDataRecord };
