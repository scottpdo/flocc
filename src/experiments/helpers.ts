import { ParameterRange, ParameterSpec } from "./types";
export { formatCSVValue } from "../utils/csv";

export const isRange = (value: any): value is ParameterRange => {
  return (
    typeof value === "object" &&
    value !== null &&
    "min" in value && typeof value.min === "number" &&
    "max" in value && typeof value.max === "number" &&
    "step" in value && typeof value.step === "number"
  );
}

/**
 * Convert a range specification to an array of values.
 */
const rangeToArray = (range: ParameterRange): number[] => {
  const values: number[] = [];
  if (range.step <= 0 || range.min > range.max) {
    console.warn("Invalid range: step must be > 0 and min must be <= max. Returning [min].");
    return [range.min];
  }
  // Use epsilon to handle floating point comparison
  const epsilon = range.step / 1000;
  for (let v = range.min; v <= range.max + epsilon; v += range.step) {
    // Round to avoid floating point artifacts
    values.push(Math.round(v * 1e10) / 1e10);
  }
  return values;
}

/**
 * Expand parameter specifications into arrays of values.
 */
export const expandParameters = (
  params: Record<string, ParameterSpec | any>
): Record<string, any[]> => {
  const expanded: Record<string, any[]> = {};

  for (const [key, spec] of Object.entries(params)) {
    if (Array.isArray(spec)) {
      // Already an array
      expanded[key] = spec;
    } else if (isRange(spec)) {
      // Range specification
      expanded[key] = rangeToArray(spec);
    } else {
      // Single value — wrap in array
      expanded[key] = [spec];
    }
  }

  return expanded;
}

/**
 * Generate all parameter combinations (Cartesian product).
 */
export const generateCombinations = (parameterSpace: Record<string, any>): Record<string, any>[] => {
  const keys = Object.keys(parameterSpace);
  if (keys.length === 0) return [{}];

  const combinations: Record<string, any>[] = [];

  const recurse = (index: number, current: Record<string, any>) => {
    if (index === keys.length) {
      combinations.push({ ...current });
      return;
    }

    const key = keys[index];
    for (const value of parameterSpace[key]) {
      current[key] = value;
      recurse(index + 1, current);
    }
  };

  recurse(0, {});
  return combinations;
}

