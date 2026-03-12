/**
 * Format a value for CSV output, quoting strings that contain commas,
 * double-quotes, or newlines.
 * @internal
 */
export function formatCSVValue(value: any): string {
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
