const { Agent, Environment, Rule } = require("../dist/flocc");

const environment = new Environment();

// ============================================================
// Task 1: Runtime Error Messages
// ============================================================

describe("Runtime warnings", () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warns on unknown string operator", () => {
    const rule = new Rule(environment, ["ad", 1, 2]);
    rule.call();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('unknown operator "ad"')
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Valid operators:")
    );
  });

  it("does not warn when first element is a non-string (data array)", () => {
    const rule = new Rule(environment, [1, 2, 3]);
    const result = rule.call();
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("unknown operator")
    );
    expect(result).toEqual([1, 2, 3]);
  });

  it("still returns the array for unknown operators (graceful degradation)", () => {
    const rule = new Rule(environment, ["foo", 1, 2]);
    const result = rule.call();
    expect(result).toEqual(["foo", 1, 2]);
  });

  it("warns on wrong arity (too few args)", () => {
    const rule = new Rule(environment, ["add", 1]);
    rule.call();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"add" expects 2 arguments, got 1')
    );
  });

  it("warns on wrong arity for get (too few)", () => {
    const agent = new Agent();
    const rule = new Rule(environment, ["get"]);
    // Even with an agent, the arity warning should fire
    rule.call(agent);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"get" expects 1 argument, got 0')
    );
  });

  it("warns on arithmetic type mismatch", () => {
    const agent = new Agent();
    agent.set("x", "hello");
    const rule = new Rule(environment, ["add", ["get", "x"], 1]);
    rule.call(agent);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"add" expects numeric arguments, got string and number')
    );
  });

  it("warns on multiply type mismatch", () => {
    const agent = new Agent();
    agent.set("a", true);
    const rule = new Rule(environment, ["multiply", ["get", "a"], 5]);
    rule.call(agent);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"multiply" expects numeric arguments, got boolean and number')
    );
  });

  it("warns when get returns null for nonexistent key", () => {
    const agent = new Agent();
    const rule = new Rule(environment, ["get", "nonexistent"]);
    const result = rule.call(agent);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"get" returned null for key "nonexistent"')
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("key may not exist on agent")
    );
  });

  it("does not warn when get returns a valid value", () => {
    const agent = new Agent();
    agent.set("x", 42);
    const rule = new Rule(environment, ["get", "x"]);
    rule.call(agent);
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('"get" returned null')
    );
  });

  it("warns for all arithmetic operators on type mismatch", () => {
    const ops = ["subtract", "divide", "mod", "power"];
    const agent = new Agent();
    agent.set("s", "text");
    for (const op of ops) {
      warnSpy.mockClear();
      const rule = new Rule(environment, [op, ["get", "s"], 2]);
      rule.call(agent);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`"${op}" expects numeric arguments`)
      );
    }
  });
});

// ============================================================
// Task 2: Construction-Time Validation
// ============================================================

describe("Rule.validate()", () => {
  it("returns empty array for valid simple rule", () => {
    const rule = new Rule(environment, ["add", 1, 2]);
    const diags = rule.validate();
    expect(diags).toEqual([]);
  });

  it("returns empty array for valid nested rule", () => {
    const rule = new Rule(environment, ["set", "x", ["add", 1, ["get", "x"]]]);
    const diags = rule.validate();
    expect(diags).toEqual([]);
  });

  it("reports unknown operator as error", () => {
    const rule = new Rule(environment, ["foo", 1, 2]);
    const diags = rule.validate();
    expect(diags.length).toBe(1);
    expect(diags[0].level).toBe("error");
    expect(diags[0].message).toContain('Unknown operator "foo"');
  });

  it("reports wrong arity as error (too few)", () => {
    const rule = new Rule(environment, ["add", 1]);
    const diags = rule.validate();
    expect(diags.length).toBe(1);
    expect(diags[0].level).toBe("error");
    expect(diags[0].message).toContain('"add" expects 2 arguments, got 1');
  });

  it("reports wrong arity as error (too many)", () => {
    const rule = new Rule(environment, ["add", 1, 2, 3]);
    const diags = rule.validate();
    expect(diags.length).toBe(1);
    expect(diags[0].level).toBe("error");
    expect(diags[0].message).toContain('"add" expects 2 arguments, got 3');
  });

  it("reports empty steps as warning", () => {
    const rule = new Rule(environment, []);
    const diags = rule.validate();
    expect(diags.length).toBe(1);
    expect(diags[0].level).toBe("warning");
    expect(diags[0].message).toContain("Empty steps array");
    expect(diags[0].path).toBe("root");
  });

  it("reports bare value at top level as warning", () => {
    const rule = new Rule(environment, [["set", "x", 1], 42]);
    const diags = rule.validate();
    expect(diags.some(d => d.level === "warning" && d.message.includes("bare value"))).toBe(true);
  });

  it("validates nested steps recursively", () => {
    const rule = new Rule(environment, ["set", "x", ["ad", 1, 2]]);
    const diags = rule.validate();
    expect(diags.some(d => d.message.includes('"ad"'))).toBe(true);
  });

  it("includes path info in diagnostics", () => {
    const rule = new Rule(environment, [["add", 1, 2], ["subtract", 1]]);
    const diags = rule.validate();
    expect(diags.length).toBe(1);
    expect(diags[0].path).toBe("[1]");
  });

  it("validates variadic operators correctly", () => {
    // log with 1+ args is fine
    const rule1 = new Rule(environment, ["log", 42]);
    expect(rule1.validate()).toEqual([]);

    // log with 3 args is fine
    const rule2 = new Rule(environment, ["log", 1, 2, 3]);
    expect(rule2.validate()).toEqual([]);

    // vector with 0 args is NOT fine (needs 1+)
    const rule3 = new Rule(environment, ["vector"]);
    const diags = rule3.validate();
    expect(diags.length).toBe(1);
    expect(diags[0].level).toBe("error");
  });

  it("validates zero-arg operators", () => {
    const rule1 = new Rule(environment, ["agent"]);
    expect(rule1.validate()).toEqual([]);

    const rule2 = new Rule(environment, ["agent", "extra"]);
    const diags = rule2.validate();
    expect(diags.length).toBe(1);
    expect(diags[0].level).toBe("error");
  });

  it("validates local (variable arity 1-2)", () => {
    const rule1 = new Rule(environment, [["local", "x", 1], ["local", "x"]]);
    expect(rule1.validate()).toEqual([]);

    const rule2 = new Rule(environment, ["local"]);
    const diags = rule2.validate();
    expect(diags.length).toBe(1);
    expect(diags[0].level).toBe("error");
  });

  it("catches multiple errors in complex rules", () => {
    const rule = new Rule(environment, [
      ["foo", 1],        // unknown op
      ["add", 1],        // wrong arity
      ["get", "x"]       // valid
    ]);
    const diags = rule.validate();
    expect(diags.length).toBe(2);
  });
});

describe("Rule.operatorInfo", () => {
  it("is a static property on Rule", () => {
    expect(Rule.operatorInfo).toBeDefined();
    expect(typeof Rule.operatorInfo).toBe("object");
  });

  it("has correct info for arithmetic operators", () => {
    expect(Rule.operatorInfo.add).toEqual({ min: 2, max: 2 });
    expect(Rule.operatorInfo.subtract).toEqual({ min: 2, max: 2 });
    expect(Rule.operatorInfo.multiply).toEqual({ min: 2, max: 2 });
  });

  it("has correct info for variadic operators", () => {
    expect(Rule.operatorInfo.log.min).toBe(1);
    expect(Rule.operatorInfo.log.max).toBe(Infinity);
    expect(Rule.operatorInfo.vector.min).toBe(1);
    expect(Rule.operatorInfo.method.min).toBe(2);
  });

  it("has correct info for zero-arg operators", () => {
    expect(Rule.operatorInfo.agent).toEqual({ min: 0, max: 0 });
    expect(Rule.operatorInfo.environment).toEqual({ min: 0, max: 0 });
  });

  it("has correct info for variable arity operators", () => {
    expect(Rule.operatorInfo.local).toEqual({ min: 1, max: 2 });
    expect(Rule.operatorInfo["if"]).toEqual({ min: 2, max: 3 });
  });
});

// ============================================================
// Task 3: Improved log operator
// ============================================================

describe("Improved log operator", () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs with the correct format", () => {
    const rule = new Rule(environment, ["log", 42]);
    rule.call();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Rule log:")
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("→")
    );
  });

  it("returns the evaluated value (not null)", () => {
    const agent = new Agent();
    agent.set("x", 10);
    const rule = new Rule(environment, ["log", ["get", "x"]]);
    const result = rule.call(agent);
    expect(result).toBe(10);
  });

  it("can be used inline without disrupting evaluation", () => {
    const agent = new Agent();
    agent.set("x", 5);
    // ["add", ["log", ["get", "x"]], 1] should return 6
    const rule = new Rule(environment, ["add", ["log", ["get", "x"]], 1]);
    const result = rule.call(agent);
    expect(result).toBe(6);
  });

  it("logs each argument and returns the last value", () => {
    const agent = new Agent();
    agent.set("a", 1);
    agent.set("b", 2);
    const rule = new Rule(environment, ["log", ["get", "a"], ["get", "b"]]);
    const result = rule.call(agent);
    expect(result).toBe(2);
    // Should have logged twice
    expect(logSpy).toHaveBeenCalledTimes(2);
  });

  it("formats expressions readably (not raw arrays)", () => {
    const rule = new Rule(environment, ["log", ["add", 1, 2]]);
    rule.call();
    // The log should contain a readable representation
    const logCall = logSpy.mock.calls[0][0];
    expect(logCall).toContain("Rule log:");
    // Should not be raw Array toString
    expect(logCall).not.toBe("logging");
    // Should contain the result
    expect(logCall).toContain("3");
  });

  it("handles simple literal values", () => {
    const rule = new Rule(environment, ["log", 42]);
    const result = rule.call();
    expect(result).toBe(42);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("42")
    );
  });

  it("handles string values", () => {
    const rule = new Rule(environment, ["log", "hello"]);
    const result = rule.call();
    expect(result).toBe("hello");
  });
});

// ============================================================
// Regression: existing functionality still works
// ============================================================

describe("Regression tests", () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("map still works correctly", () => {
    const rule = new Rule(environment, ["map", [1, 2, 3], ["add", 2]]);
    expect(rule.call()).toEqual([3, 4, 5]);
  });

  it("filter still works correctly", () => {
    const rule = new Rule(environment, ["filter", [1, 2, 3, 4, 5], ["gte", 3]]);
    expect(rule.call()).toEqual([3, 4, 5]);
  });

  it("nested operations work", () => {
    const rule = new Rule(environment, ["add", ["multiply", 2, 3], ["subtract", 10, 4]]);
    expect(rule.call()).toBe(12);
  });

  it("if-then-else still works", () => {
    const rule = new Rule(environment, ["if", true, 1, 2]);
    expect(rule.call()).toBe(1);

    const rule2 = new Rule(environment, ["if", false, 1, 2]);
    expect(rule2.call()).toBe(2);
  });

  it("if without else branch (2 args) works and returns null on false", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const rule = new Rule(environment, ["if", true, 42]);
    expect(rule.call()).toBe(42);

    const rule2 = new Rule(environment, ["if", false, 42]);
    expect(rule2.call()).toBeNull();

    // Should not trigger any arity warnings
    expect(console.warn).not.toHaveBeenCalled();

    // validate() should also be clean
    expect(rule.validate()).toEqual([]);
    jest.restoreAllMocks();
  });

  it("set and get with agent", () => {
    const agent = new Agent();
    const rule = new Rule(environment, [["set", "x", 42], ["get", "x"]]);
    expect(rule.call(agent)).toBe(42);
  });

  it("local variables work", () => {
    const rule = new Rule(environment, [["local", "i", 10], ["local", "i"]]);
    expect(rule.call()).toBe(10);
  });
});

// ============================================================
// Task 4: Pretty-Printing — format() / toString()
// ============================================================

describe("Rule.format() and Rule.toString()", () => {
  it("formats a simple expression on one line", () => {
    const rule = new Rule(environment, ["add", 1, 2]);
    expect(rule.format()).toBe("(add 1 2)");
  });

  it("formats nested expression that fits on one line", () => {
    const rule = new Rule(environment, ["add", 1, ["get", "x"]]);
    expect(rule.format()).toBe('(add 1 (get "x"))');
  });

  it("wraps nested expression when it exceeds maxLineWidth", () => {
    const rule = new Rule(environment, [
      "set", "myLongVariableName", ["add", ["get", "myLongVariableName"], ["get", "anotherLongName"]]
    ]);
    const formatted = rule.format({ maxLineWidth: 40 });
    expect(formatted).toContain("\n");
    // Should start with (set
    expect(formatted).toMatch(/^\(set/);
  });

  it("separates multi-step rules with blank lines", () => {
    const rule = new Rule(environment, [
      ["set", "x", ["add", 1, ["get", "x"]]],
      ["set", "y", ["subtract", ["get", "y"], 1]]
    ]);
    const formatted = rule.format();
    expect(formatted).toContain("\n\n");
    const parts = formatted.split("\n\n");
    expect(parts.length).toBe(2);
    expect(parts[0]).toContain("set");
    expect(parts[1]).toContain("set");
  });

  it("quotes strings", () => {
    const rule = new Rule(environment, ["get", "x"]);
    expect(rule.format()).toBe('(get "x")');
  });

  it("formats numbers bare", () => {
    const rule = new Rule(environment, ["add", 42, 3.14]);
    expect(rule.format()).toBe("(add 42 3.14)");
  });

  it("formats booleans bare", () => {
    const rule = new Rule(environment, ["if", true, 1, 2]);
    expect(rule.format()).toBe("(if true 1 2)");
  });

  it("formats null/undefined as null", () => {
    const rule = new Rule(environment, ["if", null, 1, 2]);
    expect(rule.format()).toContain("null");
  });

  it("respects custom indent option", () => {
    const rule = new Rule(environment, [
      "set", "myLongVariableName", ["add", ["get", "myLongVariableName"], ["get", "anotherLongName"]]
    ]);
    const formatted = rule.format({ indent: "    ", maxLineWidth: 30 });
    // Should use 4-space indent
    expect(formatted).toMatch(/\n {4}/);
  });

  it("respects custom maxLineWidth option", () => {
    const rule = new Rule(environment, ["add", 1, 2]);
    // With very small maxLineWidth, even simple expressions wrap
    const formatted = rule.format({ maxLineWidth: 5 });
    expect(formatted).toContain("\n");
  });

  it("toString() returns same as format()", () => {
    const rule = new Rule(environment, ["set", "x", ["add", 1, ["get", "x"]]]);
    expect(rule.toString()).toBe(rule.format());
  });

  it("handles objects that are not arrays via JSON.stringify", () => {
    const rule = new Rule(environment, ["log", { key: "value" }]);
    const formatted = rule.format();
    expect(formatted).toContain('{"key":"value"}');
  });
});

describe("Rule.formatSteps() static method", () => {
  it("formats a single step", () => {
    expect(Rule.formatSteps(["add", 1, 2])).toBe("(add 1 2)");
  });

  it("formats multi-step arrays", () => {
    const result = Rule.formatSteps([
      ["set", "x", 1],
      ["set", "y", 2]
    ]);
    expect(result).toContain("\n\n");
    expect(result).toContain('(set "x" 1)');
    expect(result).toContain('(set "y" 2)');
  });

  it("accepts format options", () => {
    const result = Rule.formatSteps(
      ["set", "aVeryLongVariableNameIndeed", ["add", ["get", "aVeryLongVariableNameIndeed"], 1]],
      { maxLineWidth: 30 }
    );
    expect(result).toContain("\n");
  });
});

// ============================================================
// Task 5: Trace Mode
// ============================================================

describe("Trace mode", () => {
  let logSpy;
  let warnSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("trace=false produces no trace output (default)", () => {
    const rule = new Rule(environment, ["add", 1, 2]);
    rule.call();
    // Should not have any "Rule trace:" calls
    const traceCalls = logSpy.mock.calls.filter(c => c[0] && c[0].includes("Rule trace:"));
    expect(traceCalls.length).toBe(0);
  });

  it("trace defaults to false", () => {
    const rule = new Rule(environment, ["add", 1, 2]);
    expect(rule.trace).toBe(false);
  });

  it("trace=true logs each operator evaluation", () => {
    const rule = new Rule(environment, ["add", 1, 2]);
    rule.trace = true;
    rule.call();
    const traceCalls = logSpy.mock.calls.filter(c => c[0] && c[0].includes("Rule trace:"));
    expect(traceCalls.length).toBeGreaterThan(0);
    expect(traceCalls[0][0]).toContain("(add 1 2)");
    expect(traceCalls[0][0]).toContain("→");
    expect(traceCalls[0][0]).toContain("3");
  });

  it("nested steps show indented traces", () => {
    const agent = new Agent();
    agent.set("x", 5);
    const rule = new Rule(environment, ["add", 1, ["get", "x"]]);
    rule.trace = true;
    rule.call(agent);
    const traceCalls = logSpy.mock.calls.filter(c => c[0] && c[0].includes("Rule trace:"));
    // Should have traces for both get and add
    expect(traceCalls.length).toBe(2);
    // get should be more indented than add (it's nested)
    const getLine = traceCalls.find(c => c[0].includes("get"));
    const addLine = traceCalls.find(c => c[0].includes("add"));
    expect(getLine).toBeDefined();
    expect(addLine).toBeDefined();
    // get should have more indentation (deeper)
    const getIndent = getLine[0].match(/Rule trace: ( *)/)[1].length;
    const addIndent = addLine[0].match(/Rule trace: ( *)/)[1].length;
    expect(getIndent).toBeGreaterThan(addIndent);
  });

  it("traceLog captures all lines", () => {
    const rule = new Rule(environment, ["add", 1, 2]);
    rule.trace = true;
    rule.call();
    expect(rule.traceLog.length).toBeGreaterThan(0);
    expect(rule.traceLog[0]).toContain("Rule trace:");
    expect(rule.traceLog[0]).toContain("(add 1 2)");
  });

  it("traceLog is cleared on each call()", () => {
    const rule = new Rule(environment, ["add", 1, 2]);
    rule.trace = true;
    rule.call();
    const firstLen = rule.traceLog.length;
    expect(firstLen).toBeGreaterThan(0);
    rule.call();
    // Should be same length (cleared + repopulated), not doubled
    expect(rule.traceLog.length).toBe(firstLen);
  });

  it("trace works with if/and/or conditional operators", () => {
    const rule = new Rule(environment, ["if", ["and", true, false], 1, 2]);
    rule.trace = true;
    const result = rule.call();
    expect(result).toBe(2);
    expect(rule.traceLog.some(l => l.includes("and"))).toBe(true);
    expect(rule.traceLog.some(l => l.includes("if"))).toBe(true);
  });

  it("trace works with or operator", () => {
    const rule = new Rule(environment, ["or", true, false]);
    rule.trace = true;
    const result = rule.call();
    expect(result).toBe(true);
    expect(rule.traceLog.some(l => l.includes("or"))).toBe(true);
  });

  it("trace works with map", () => {
    const rule = new Rule(environment, ["map", [1, 2, 3], ["add", 10]]);
    rule.trace = true;
    const result = rule.call();
    expect(result).toEqual([11, 12, 13]);
    expect(rule.traceLog.some(l => l.includes("map"))).toBe(true);
    expect(rule.traceLog.some(l => l.includes("add"))).toBe(true);
  });

  it("trace works with filter", () => {
    const rule = new Rule(environment, ["filter", [1, 2, 3, 4, 5], ["gte", 3]]);
    rule.trace = true;
    const result = rule.call();
    expect(result).toEqual([3, 4, 5]);
    expect(rule.traceLog.some(l => l.includes("filter"))).toBe(true);
    expect(rule.traceLog.some(l => l.includes("gte"))).toBe(true);
  });

  it("traceLog strings match what is console.logged", () => {
    const rule = new Rule(environment, ["add", 1, 2]);
    rule.trace = true;
    rule.call();
    const traceCalls = logSpy.mock.calls
      .filter(c => c[0] && c[0].includes("Rule trace:"))
      .map(c => c[0]);
    expect(rule.traceLog).toEqual(traceCalls);
  });
});
