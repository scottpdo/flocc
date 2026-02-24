# Code Review: feature/recorder-v2 (v0.7.0)

Comparing `feature/recorder-v2` against `main` (base commit `e7506cb`).

Two commits add new surface area:
- `62d3390` — `Recorder` class + tests
- `cd3183a` — `Experiment` class + tests

Plus small modifications to `Environment`, `EventBus`, and `main.ts`.

---

## Overall Impression

The design is clear and well-motivated. JSDoc coverage is thorough, test breadth is good, and the API is ergonomic. The section below focuses on bugs, footguns, and gaps.

---

## Bugs

### 1. `Recorder.reset()` does not reset `hasWarnedDuplicate`

**File:** `src/recorders/Recorder.ts`

`reset()` clears data arrays and `lastRecordedTime` but leaves `hasWarnedDuplicate = true`.
After a reset, if the caller again records twice in the same tick, no warning fires.

```ts
reset(): void {
  this.modelData = { time: [] };
  // ...
  this.lastRecordedTime = -1;
  // BUG: this.hasWarnedDuplicate is never reset
}
```

**Fix:** add `this.hasWarnedDuplicate = false;` inside `reset()`.

---

### 2. `subscribeToTicks()` tick counter is not reset by `reset()`

**File:** `src/recorders/Recorder.ts`

The numeric-interval counter lives in a closure inside `subscribeToTicks()`:

```ts
private subscribeToTicks(): void {
  let tickCounter = 0;   // <-- captured in closure, unreachable from reset()
  this.unsubscribe = this.environment.events.on("tick:end", () => {
    tickCounter++;
    if (typeof this.interval === "number") {
      if (tickCounter % this.interval === 0) this.record();
    }
  });
}
```

If a user runs 7 ticks, calls `reset()`, then runs 3 more ticks with `interval: 5`, the next
recording fires at tick 10 (global), not tick 5 (relative to reset). This is surprising
and untested.

**Fix options:**
- Promote `tickCounter` to a private field so `reset()` can zero it.
- Re-subscribe on `reset()` (tear down and recreate the listener).

---

### 3. `ExperimentResults.aggregate()` comma-joining breaks on parameter values that contain commas

**File:** `src/experiments/Experiment.ts`

`groupBy()` constructs a composite key by joining parameter values with `","`:

```ts
const groupKey = keyArray.map((k) => run.parameters[k]).join(",");
```

`aggregate()` then splits that key back:

```ts
const keyValues = groupKey.split(",");
options.groupBy.forEach((key, i) => {
  const value = keyValues[i];
  result.parameters[key] = isNaN(Number(value)) ? value : Number(value);
});
```

A string parameter value like `"fast,aggressive"` will split into three tokens instead of
two, silently corrupting every aggregate result for that group.

**Fix:** use a delimiter that cannot appear in parameter values (e.g. `"\0"`), or store
the decomposed key as a `Map<string, any>` rather than a serialised string.

---

### 4. `Experiment.rangeToArray()` has no guard against infinite loops

**File:** `src/experiments/Experiment.ts`

```ts
private rangeToArray(range: ParameterRange): number[] {
  const values: number[] = [];
  const epsilon = range.step / 1000;
  for (let v = range.min; v <= range.max + epsilon; v += range.step) {
    values.push(Math.round(v * 1e10) / 1e10);
  }
  return values;
}
```

If a caller passes `step: 0`, this loops forever. If `step` is negative and `min < max`,
it also loops forever.

**Fix:** validate in the constructor (or at least in `isRange`) that `step > 0` and
`min <= max`, and throw a descriptive error.

---

### 5. `isRange()` does not verify that the values are numbers

**File:** `src/experiments/Experiment.ts`

```ts
private isRange(value: any): value is ParameterRange {
  return (
    typeof value === "object" && value !== null &&
    "min" in value && "max" in value && "step" in value
  );
}
```

`{ min: "a", max: "b", step: "c" }` passes this guard. `rangeToArray` then produces
`[NaN]` silently. The TypeScript types enforce correctness at compile time, but the
guard should also be safe at runtime for JS callers.

**Fix:** add `typeof value.min === "number" && typeof value.max === "number" && typeof value.step === "number"`.

---

## Design / API Issues

### 6. `getModelData()`, `getAgentData()`, and `toJSON()` return internal mutable references

**File:** `src/recorders/Recorder.ts`

```ts
getModelData(): ModelData { return this.modelData; }
getAgentData(): AgentDataRecord[] { return this.agentData; }
toJSON(...): ModelData | AgentDataRecord[] {
  if (type === "agent") return this.agentData;
  return this.modelData;
}
```

A caller who does `const data = recorder.getModelData(); data.time.push(999);` silently
corrupts the recorder's internal state. Because these are large arrays (performance
matters), a full deep-copy on every call would be wrong, but the current contract is
undocumented.

**Options (pick one):**
- Document explicitly that the returned object is a live reference and must not be mutated.
- Return a shallow copy: `return { ...this.modelData }` (copies the top-level keys but not the arrays — a middle ground that prevents key deletion without the array-copy cost).
- Freeze the object in development builds.

---

### 7. `runSingle()` has no error handling around the model factory or `env.tick()`

**File:** `src/experiments/Experiment.ts`

If `this.modelFactory(...)` throws, or if `env.tick()` throws on tick 43 of run 100,
the entire `run()` call rejects with no partial results. For long experiments this is
disruptive.

**Suggestion:** wrap `runSingle` body in a try/catch, push a failed-run sentinel to
results (or simply skip and log), and continue. At minimum, document the current
behaviour so users know to guard their factories.

---

### 8. `stopCondition` is evaluated *before* the first tick

**File:** `src/experiments/Experiment.ts`

```ts
while (ticks < this.maxTicks) {
  if (this.stopCondition && this.stopCondition(env)) {
    stoppedEarly = true;
    break;
  }
  env.tick();
  ticks++;
}
```

If the environment happens to satisfy the stop condition at creation time (e.g., it
starts with zero agents and the condition is `env.getAgents().length === 0`), the run
exits with `ticks: 0` and `stoppedEarly: true`. This may or may not be desired, but
it is surprising and untested. Consider evaluating the stop condition *after* the tick,
or at least documenting the order.

---

### 9. `agentDataToCSV()` infers schema from the first record only

**File:** `src/recorders/Recorder.ts`

```ts
private agentDataToCSV(): string {
  if (this.agentData.length === 0) return "";
  const keys = Object.keys(this.agentData[0]); // schema from first record
  // ...
}
```

If a metric function throws on tick 1 (setting that key to `null`) but the first record
happens to be missing a key for some other reason, subsequent rows may have extra fields
that get silently dropped. (In practice the schema is stable because it is driven by
`Object.keys(this.agentMetrics)`, but the coupling is implicit and fragile.)

**Suggestion:** compute the header from `Object.keys(this.agentMetrics)` + `["time"]`
explicitly rather than from the first data record.

---

### 10. `formatCSVValue` is duplicated in `Recorder` and `ExperimentResults`

**Files:** `src/recorders/Recorder.ts`, `src/experiments/Experiment.ts`

The private method is byte-for-byte identical in both classes. Since `ExperimentResults`
does not import from `Recorder`, the only clean fix is a shared utility:

```ts
// src/utils/csv.ts
export function formatCSVValue(value: any): string { ... }
```

This is a maintainability concern — a bug fix in one copy won't automatically propagate.

---

## Minor / Nit

### 11. `ModelData` type union is redundant

```ts
interface ModelData {
  time: number[];
  [key: string]: number[] | any[];  // any[] subsumes number[]
}
```

`number[]` in the union is dead — `any[]` already covers it. Simplify to `any[]`, or
better, use `unknown[]` to force callers to narrow before using values.

---

### 12. `@hidden` tags on private methods are unnecessary

JSDoc generators already exclude `private` members. The `@hidden` tags are noise.

---

### 13. `ExperimentProgress.currentReplication` is 0-indexed without documentation

Users displaying progress UI will need to add 1 to get a human-readable replication
number. A one-line note in the JSDoc would prevent confusion.

---

### 14. Seeds for replications are global-sequential, not per-combination

With `replications: 3` and `parameters: { a: [1, 2] }`, seeds assigned are:

```
a=1, rep 0 → seed 0
a=1, rep 1 → seed 1
a=1, rep 2 → seed 2
a=2, rep 0 → seed 3
a=2, rep 1 → seed 4
a=2, rep 2 → seed 5
```

This means adding a new parameter combination changes every seed for all subsequent
combinations. Many modellers expect replication seeds to be stable across parameter
additions. Consider deriving seeds as `baseSeed + combinationIndex * replications + repIndex`.
Either way, document the current scheme clearly.

---

## Positive Notes

- Auto-creation of `EventBus` in `Environment` (removing the `| null`) is a
  straightforward improvement that the `Recorder` now depends on correctly.
- The `EventBus.emit()` early-exit optimisation is clean and correct.
- Test coverage is broad; edge cases like floating-point ranges, CSV special characters,
  detach-then-tick, and metric errors are all covered.
- The `ExperimentResults` query API (`filter`, `groupBy`, `aggregate`) is well-designed
  and usable.
- JSDoc with `@example` blocks throughout is a high bar that should be maintained.
- The `interval: 'end'` default for experiments is the right ergonomic choice.
- Exporting all relevant types (not just classes) from `main.ts` is correct.
