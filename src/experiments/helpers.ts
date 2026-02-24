import { ParameterRange, ParameterSpec } from "./types";

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
  if (range.step <= 0 || range.min >= range.max) {
    console.warn("The given range configuration would result in an infinite loop. `rangeToArray` is only returning a single step for the given minimum value.");
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

/**
 * Format a value for CSV output.
 */
export const formatCSVValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
}