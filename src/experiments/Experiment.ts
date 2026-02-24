import { Environment } from "../environments/Environment";
import { Recorder, RecorderOptions } from "../recorders/Recorder";
import { seed as setSeed } from "../utils/utils";
import { expandParameters, formatCSVValue, generateCombinations } from "./helpers";
import { ExperimentRecordOptions, ModelFactory, ParameterSpec } from "./types";

const DELIMITER = "\0";

/**
 * Configuration options for an Experiment.
 */
interface ExperimentOptions {
  /**
   * Factory function that creates an Environment for each run.
   * Receives parameters and seed for the run.
   *
   * @example
   * ```js
   * model: ({ parameters, seed }) => {
   *   utils.seed(seed);
   *   const env = new Environment({ width: 400, height: 400 });
   *   for (let i = 0; i < parameters.agentCount; i++) {
   *     env.addAgent(new Agent({ speed: parameters.speed }));
   *   }
   *   return env;
   * }
   * ```
   */
  model: ModelFactory;

  /**
   * Parameter space to explore. Each key maps to either:
   * - An array of values to use
   * - A range object `{ min, max, step }` that generates values
   * - A single value (constant across all runs)
   *
   * @example
   * ```js
   * parameters: {
   *   agentCount: [10, 20, 30],           // array of values
   *   speed: { min: 1, max: 3, step: 0.5 }, // range → [1, 1.5, 2, 2.5, 3]
   *   worldSize: 400,                      // constant
   * }
   * ```
   */
  parameters: Record<string, ParameterSpec | any>;

  /**
   * Number of replications per parameter combination.
   * Each replication uses a different random seed.
   * @default 1
   */
  replications?: number;

  /**
   * Maximum number of ticks to run each simulation.
   * @default 1000
   */
  maxTicks?: number;

  /**
   * Optional condition to stop a run early.
   * If provided, the run stops when this returns true OR maxTicks is reached.
   *
   * @example
   * ```js
   * stopCondition: (env) => env.getAgents().length === 0
   * ```
   */
  stopCondition?: (env: Environment) => boolean;

  /**
   * Recording configuration (same format as RecorderOptions, plus 'end' interval).
   * Defaults to interval: 'end' for experiments.
   */
  record?: ExperimentRecordOptions;

  /**
   * Base seed for random number generation.
   * Seeds are auto-incremented for each run.
   * @default 0
   */
  seed?: number;
}

/**
 * Result from a single run.
 */
interface RunResult {
  /** Index of this run (0-based) */
  runIndex: number;
  /** Parameter values used for this run */
  parameters: Record<string, any>;
  /** Random seed used for this run */
  seed: number;
  /** Number of ticks the run executed */
  ticks: number;
  /** Whether the run ended due to stopCondition (vs maxTicks) */
  stoppedEarly: boolean;
  /** Recorded metrics (if interval was 'end', single values; otherwise time series) */
  metrics: Record<string, any>;
  /** Agent data if agent metrics were configured */
  agentData?: any[];
}

/**
 * Summary of experiment execution.
 */
interface ExperimentSummary {
  totalRuns: number;
  parameterCombinations: number;
  replicationsPerCombination: number;
  completedRuns: number;
  elapsedMs: number;
}

/**
 * Results from an experiment with query and export methods.
 */
class ExperimentResults {
  /** Raw array of all run results */
  readonly data: RunResult[];
  private readonly parameterCombinations: number;
  private readonly replications: number;
  private readonly elapsedMs: number;

  constructor(
    data: RunResult[],
    parameterCombinations: number,
    replications: number,
    elapsedMs: number
  ) {
    this.data = data;
    this.parameterCombinations = parameterCombinations;
    this.replications = replications;
    this.elapsedMs = elapsedMs;
  }

  /**
   * Get summary statistics about the experiment.
   */
  summary(): ExperimentSummary {
    return {
      totalRuns: this.parameterCombinations * this.replications,
      parameterCombinations: this.parameterCombinations,
      replicationsPerCombination: this.replications,
      completedRuns: this.data.length,
      elapsedMs: this.elapsedMs,
    };
  }

  /**
   * Filter results by parameter values.
   *
   * @example
   * ```js
   * results.filter({ agentCount: 10 })
   * results.filter({ agentCount: 10, speed: 2.0 })
   * ```
   */
  filter(params: Record<string, any>): RunResult[] {
    return this.data.filter((run) => {
      for (const [key, value] of Object.entries(params)) {
        if (run.parameters[key] !== value) return false;
      }
      return true;
    });
  }

  /**
   * Group results by one or more parameter keys.
   *
   * @example
   * ```js
   * results.groupBy('agentCount')
   * // Returns: Map { 10 => [...runs], 20 => [...runs], 30 => [...runs] }
   *
   * results.groupBy(['agentCount', 'speed'])
   * // Returns: Map { '10,1' => [...runs], '10,2' => [...runs], ... }
   * ```
   */
  groupBy(keys: string | string[]): Map<string, RunResult[]> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const groups = new Map<string, RunResult[]>();

    for (const run of this.data) {
      const groupKey = keyArray.map((k) => run.parameters[k]).join(DELIMITER);
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(run);
    }

    return groups;
  }

  /**
   * Aggregate results across replications.
   *
   * @example
   * ```js
   * results.aggregate({
   *   groupBy: ['agentCount', 'speed'],
   *   metrics: {
   *     meanPopulation: (runs) => mean(runs.map(r => r.metrics.population)),
   *     extinctionRate: (runs) => runs.filter(r => r.metrics.population === 0).length / runs.length,
   *   },
   * })
   * ```
   */
  aggregate(options: {
    groupBy: string[];
    metrics: Record<string, (runs: RunResult[]) => any>;
  }): AggregatedResult[] {
    const groups = this.groupBy(options.groupBy);
    const results: AggregatedResult[] = [];

    groups.forEach((runs, groupKey) => {
      const result: AggregatedResult = {
        parameters: {},
        metrics: {},
      };

      // Extract parameter values from group key
      const keyValues = groupKey.split(DELIMITER);
      options.groupBy.forEach((key, i) => {
        // Try to parse as number, otherwise keep as string
        const value = keyValues[i];
        result.parameters[key] = isNaN(Number(value)) ? value : Number(value);
      });

      // Compute aggregate metrics
      for (const [metricName, aggregateFn] of Object.entries(options.metrics)) {
        try {
          result.metrics[metricName] = aggregateFn(runs);
        } catch (error) {
          console.error(`Error computing aggregate metric "${metricName}":`, error);
          result.metrics[metricName] = null;
        }
      }

      results.push(result);
    });

    return results;
  }

  /**
   * Export results to CSV string.
   */
  toCSV(): string {
    if (this.data.length === 0) return "";

    // Collect all parameter keys and metric keys
    const paramKeys = Object.keys(this.data[0].parameters);
    const metricKeys = Object.keys(this.data[0].metrics);

    const headers = [
      "runIndex",
      "seed",
      "ticks",
      "stoppedEarly",
      ...paramKeys,
      ...metricKeys,
    ];

    const rows: string[] = [headers.join(",")];

    for (const run of this.data) {
      const row = [
        run.runIndex,
        run.seed,
        run.ticks,
        run.stoppedEarly,
        ...paramKeys.map((k) => formatCSVValue(run.parameters[k])),
        ...metricKeys.map((k) => formatCSVValue(run.metrics[k])),
      ];
      rows.push(row.join(","));
    }

    return rows.join("\n");
  }

  /**
   * Export results to JSON object.
   */
  toJSON(): RunResult[] {
    return this.data;
  }
}

/**
 * Single aggregated result row.
 */
interface AggregatedResult {
  parameters: Record<string, any>;
  metrics: Record<string, any>;
}

/**
 * Progress information passed to onProgress callback.
 */
interface ExperimentProgress {
  completed: number;
  total: number;
  currentParams: Record<string, any>;
  currentReplication: number;
}

/**
 * Options for running an experiment.
 */
interface RunOptions {
  /**
   * Callback invoked after each run completes.
   */
  onProgress?: (progress: ExperimentProgress) => void;

  /**
   * Callback invoked with results of each run (for streaming).
   */
  onRunComplete?: (result: RunResult) => void;
}

/**
 * Orchestrates multiple simulation runs with parameter variations.
 *
 * @example
 * ```js
 * const experiment = new Experiment({
 *   model: ({ parameters, seed }) => {
 *     utils.seed(seed);
 *     const env = new Environment({ width: 400, height: 400 });
 *     for (let i = 0; i < parameters.agentCount; i++) {
 *       env.addAgent(new Agent({ speed: parameters.speed }));
 *     }
 *     return env;
 *   },
 *   parameters: {
 *     agentCount: [10, 20, 30],
 *     speed: { min: 1, max: 2, step: 0.5 },
 *   },
 *   replications: 10,
 *   maxTicks: 500,
 *   record: {
 *     model: {
 *       population: (env) => env.getAgents().length,
 *     },
 *   },
 * });
 *
 * const results = await experiment.run();
 * console.log(results.summary());
 * ```
 *
 * @since 0.7.0
 */
class Experiment {
  private modelFactory: ModelFactory;
  private parameterSpace: Record<string, any[]>;
  private replications: number;
  private maxTicks: number;
  private stopCondition: ((env: Environment) => boolean) | null;
  private recordOptions: RecorderOptions;
  private recordAtEnd: boolean;
  private baseSeed: number;

  constructor(options: ExperimentOptions) {
    this.modelFactory = options.model;
    this.parameterSpace = expandParameters(options.parameters);
    this.replications = options.replications ?? 1;
    this.maxTicks = options.maxTicks ?? 1000;
    this.stopCondition = options.stopCondition ?? null;
    this.baseSeed = options.seed ?? 0;

    // Handle 'end' interval specially - convert to 'manual' for Recorder
    const interval = options.record?.interval ?? "end";
    this.recordAtEnd = interval === "end";

    this.recordOptions = {
      ...options.record,
      // If 'end', use 'manual' so we control when recording happens
      interval: this.recordAtEnd ? "manual" : interval as RecorderOptions["interval"],
    };
  }

  /**
   * Run a single simulation.
   * @hidden
   */
  private runSingle(
    parameters: Record<string, any>,
    seed: number,
    runIndex: number
  ): RunResult {
    // Set the random seed
    setSeed(seed);

    // Create the environment
    const env = this.modelFactory({ parameters, seed });

    // Create recorder
    const recorder = new Recorder(env, this.recordOptions);

    // Run simulation
    let ticks = 0;
    let stoppedEarly = false;

    while (ticks < this.maxTicks) {
      // Check stop condition before ticking
      if (this.stopCondition && this.stopCondition(env)) {
        stoppedEarly = true;
        break;
      }

      env.tick();
      ticks++;
    }

    // For 'end' interval, record final state
    if (this.recordAtEnd) {
      recorder.record();
    }

    // Extract metrics
    const modelData = recorder.getModelData();
    const metrics: Record<string, any> = {};

    // Get the last recorded value for each metric
    for (const key of Object.keys(modelData)) {
      if (key === "time") continue;
      const values = modelData[key] as any[];
      metrics[key] = values.length > 0 ? values[values.length - 1] : null;
    }

    // Get agent data if configured
    const agentData = recorder.getAgentData();

    // Cleanup
    recorder.detach();

    return {
      runIndex,
      parameters,
      seed,
      ticks,
      stoppedEarly,
      metrics,
      agentData: agentData.length > 0 ? agentData : undefined,
    };
  }

  /**
   * Run the experiment.
   *
   * @param options - Optional callbacks for progress and run completion
   * @returns Promise resolving to ExperimentResults
   */
  async run(options: RunOptions = {}): Promise<ExperimentResults> {
    const startTime = Date.now();
    const combinations = generateCombinations(this.parameterSpace);
    const totalRuns = combinations.length * this.replications;
    const results: RunResult[] = [];

    let runIndex = 0;
    let currentSeed = this.baseSeed;

    for (const params of combinations) {
      for (let rep = 0; rep < this.replications; rep++) {
        // Report progress
        if (options.onProgress) {
          options.onProgress({
            completed: runIndex,
            total: totalRuns,
            currentParams: params,
            currentReplication: rep,
          });
        }

        // Run simulation
        const result = this.runSingle(params, currentSeed, runIndex);
        results.push(result);

        // Report run completion
        if (options.onRunComplete) {
          options.onRunComplete(result);
        }

        runIndex++;
        currentSeed++;

        // Yield to event loop periodically (every 10 runs) to prevent blocking
        if (runIndex % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    }

    // Final progress report
    if (options.onProgress) {
      options.onProgress({
        completed: totalRuns,
        total: totalRuns,
        currentParams: combinations[combinations.length - 1],
        currentReplication: this.replications - 1,
      });
    }

    const elapsedMs = Date.now() - startTime;
    return new ExperimentResults(
      results,
      combinations.length,
      this.replications,
      elapsedMs
    );
  }

  /**
   * Get the total number of runs that will be executed.
   */
  getTotalRuns(): number {
    return generateCombinations(this.parameterSpace).length * this.replications;
  }

  /**
   * Get all parameter combinations that will be tested.
   */
  getParameterCombinations(): Record<string, any>[] {
    return generateCombinations(this.parameterSpace);
  }
}

export {
  Experiment,
  ExperimentOptions,
  ExperimentResults,
  ExperimentProgress,
  ExperimentSummary,
  RunResult,
  RunOptions,
  AggregatedResult,
  ModelFactory,
  ParameterSpec,
};
