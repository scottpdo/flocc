import { Environment } from "../environments/Environment";
import { RecorderOptions } from "../recorders/Recorder";

/**
 * Extended recorder options for Experiment that adds 'end' interval.
 */
export interface ExperimentRecordOptions extends Omit<RecorderOptions, "interval"> {
  /**
   * When to collect data:
   * - `'end'`: only at the end of each run (default for experiments)
   * - `'tick'`: every tick
   * - `'manual'`: only when explicitly called
   * - `number`: every N ticks
   */
  interval?: "end" | "tick" | "manual" | number;
}

/**
 * Parameters passed to the model factory function.
 */
export interface ModelFactoryParams {
  /** The parameter values for this run */
  parameters: Record<string, any>;
  /** The random seed for this run */
  seed: number;
  // TODO: Add unique run ID
  // TODO: Add run index within replication group
}

/**
 * Model factory function that creates an Environment for each run.
 */
export type ModelFactory = (params: ModelFactoryParams) => Environment;

/**
 * Range specification for parameter values.
 */
export interface ParameterRange {
  min: number;
  max: number;
  step: number;
}

/**
 * Parameter value specification: array of values or a range.
 */
export type ParameterSpec = any[] | ParameterRange;

// TODO: Add distribution sampling support
// interface ParameterDistribution {
//   distribution: 'uniform' | 'normal';
//   min?: number;
//   max?: number;
//   mean?: number;
//   std?: number;
//   samples: number;
// }