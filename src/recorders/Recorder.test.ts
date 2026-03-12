import { Environment, Agent, Recorder } from '../main';

describe("Recorder", () => {
  let environment: Environment;

  beforeEach(() => {
    environment = new Environment({ width: 100, height: 100 });
  });

  it("Records model-level metrics on each tick", () => {
    // Add some agents
    for (let i = 0; i < 10; i++) {
      environment.addAgent(new Agent({ energy: 50 + i }));
    }

    const recorder = new Recorder(environment, {
      model: {
        population: (env) => env.getAgents().length,
        totalEnergy: (env) =>
          env.stat("energy").reduce((a: number, b: number) => a + b, 0),
      },
      interval: "tick",
    });

    // Run a few ticks
    environment.tick();
    environment.tick();
    environment.tick();

    const data = recorder.getModelData();

    expect(data.time).toEqual([1, 2, 3]);
    expect(data.population).toEqual([10, 10, 10]);
    expect(data.totalEnergy).toEqual([545, 545, 545]); // 50+51+...+59 = 545
  });

  it("Records at specified intervals", () => {
    environment.addAgent(new Agent());

    const recorder = new Recorder(environment, {
      model: {
        population: (env) => env.getAgents().length,
      },
      interval: 3, // every 3 ticks
    });

    // Run 9 ticks
    for (let i = 0; i < 9; i++) {
      environment.tick();
    }

    const data = recorder.getModelData();

    // Should have recorded at ticks 3, 6, 9
    expect(data.time).toEqual([3, 6, 9]);
    expect(data.population).toEqual([1, 1, 1]);
  });

  it("Records manually when interval is 'manual'", () => {
    environment.addAgent(new Agent());

    const recorder = new Recorder(environment, {
      model: {
        population: (env) => env.getAgents().length,
      },
      interval: "manual",
    });

    environment.tick();
    environment.tick();
    recorder.record(); // Manual record at tick 2

    environment.tick();
    environment.tick();
    recorder.record(); // Manual record at tick 4

    const data = recorder.getModelData();

    expect(data.time).toEqual([2, 4]);
  });

  it("Records agent-level metrics", () => {
    const a1 = new Agent({ x: 10, y: 20, type: "prey" });
    const a2 = new Agent({ x: 30, y: 40, type: "predator" });
    environment.addAgent(a1);
    environment.addAgent(a2);

    const recorder = new Recorder(environment, {
      model: {
        count: (env) => env.getAgents().length,
      },
      agent: {
        id: (agent) => agent.id,
        x: (agent) => agent.get("x"),
        type: (agent) => agent.get("type"),
      },
      interval: "tick",
    });

    environment.tick();

    const agentData = recorder.getAgentData();

    expect(agentData.length).toBe(2);
    expect(agentData[0].time).toBe(1);
    expect(agentData[0].x).toBe(10);
    expect(agentData[0].type).toBe("prey");
    expect(agentData[1].x).toBe(30);
    expect(agentData[1].type).toBe("predator");
  });

  it("Filters agents when agentFilter is provided", () => {
    environment.addAgent(new Agent({ type: "prey" }));
    environment.addAgent(new Agent({ type: "prey" }));
    environment.addAgent(new Agent({ type: "predator" }));

    const recorder = new Recorder(environment, {
      agent: {
        type: (agent) => agent.get("type"),
      },
      agentFilter: (agent) => agent.get("type") === "prey",
      interval: "tick",
    });

    environment.tick();

    const agentData = recorder.getAgentData();

    expect(agentData.length).toBe(2);
    expect(agentData.every((d) => d.type === "prey")).toBe(true);
  });

  it("Returns latest values", () => {
    environment.addAgent(new Agent({ energy: 100 }));

    const recorder = new Recorder(environment, {
      model: {
        population: (env) => env.getAgents().length,
        energy: (env) => env.stat("energy")[0],
      },
      interval: "tick",
    });

    environment.tick();
    environment.tick();

    // Modify energy
    environment.getAgents()[0].set("energy", 80);
    environment.tick();

    const latest = recorder.latest();

    expect(latest?.time).toBe(3);
    expect(latest?.population).toBe(1);
    expect(latest?.energy).toBe(80);
  });

  it("Returns null from latest() when no data recorded", () => {
    const recorder = new Recorder(environment, {
      model: { count: (env) => env.getAgents().length },
      interval: "manual",
    });

    expect(recorder.latest()).toBe(null);
  });

  it("Gets a specific metric", () => {
    environment.addAgent(new Agent());

    const recorder = new Recorder(environment, {
      model: {
        population: (env) => env.getAgents().length,
        other: () => 42,
      },
      interval: "tick",
    });

    environment.tick();
    environment.tick();

    expect(recorder.getMetric("population")).toEqual([1, 1]);
    expect(recorder.getMetric("time")).toEqual([1, 2]);
    expect(recorder.getMetric("nonexistent")).toBeUndefined();
  });

  it("Resets collected data", () => {
    environment.addAgent(new Agent());

    const recorder = new Recorder(environment, {
      model: {
        population: (env) => env.getAgents().length,
      },
      agent: {
        id: (agent) => agent.id,
      },
      interval: "tick",
    });

    environment.tick();
    environment.tick();

    expect(recorder.getModelData().time.length).toBe(2);
    expect(recorder.getAgentData().length).toBe(2);

    recorder.reset();

    expect(recorder.getModelData().time.length).toBe(0);
    expect(recorder.getAgentData().length).toBe(0);

    // Can continue recording after reset
    environment.tick();
    expect(recorder.getModelData().time.length).toBe(1);
  });

  it("Exports model data to CSV", () => {
    environment.addAgent(new Agent({ energy: 50 }));
    environment.addAgent(new Agent({ energy: 60 }));

    const recorder = new Recorder(environment, {
      model: {
        count: (env) => env.getAgents().length,
        avgEnergy: (env) => {
          const energies = env.stat("energy") as number[];
          return energies.reduce((a, b) => a + b, 0) / energies.length;
        },
      },
      interval: "tick",
    });

    environment.tick();
    environment.tick();

    const csv = recorder.toCSV();
    const lines = csv.split("\n");

    expect(lines[0]).toBe("time,count,avgEnergy");
    expect(lines[1]).toBe("1,2,55");
    expect(lines[2]).toBe("2,2,55");
  });

  it("Exports agent data to CSV", () => {
    environment.addAgent(new Agent({ x: 10, name: "Alice" }));
    environment.addAgent(new Agent({ x: 20, name: "Bob" }));

    const recorder = new Recorder(environment, {
      agent: {
        name: (agent) => agent.get("name"),
        x: (agent) => agent.get("x"),
      },
      interval: "tick",
    });

    environment.tick();

    const csv = recorder.toCSV("agent");
    const lines = csv.split("\n");

    expect(lines[0]).toBe("time,name,x");
    expect(lines[1]).toBe("1,Alice,10");
    expect(lines[2]).toBe("1,Bob,20");
  });

  it("Exports model data to JSON", () => {
    environment.addAgent(new Agent());

    const recorder = new Recorder(environment, {
      model: {
        count: (env) => env.getAgents().length,
      },
      interval: "tick",
    });

    environment.tick();
    environment.tick();

    const json = recorder.toJSON();

    expect(json).toEqual({
      time: [1, 2],
      count: [1, 1],
    });
  });

  it("Exports agent data to JSON", () => {
    environment.addAgent(new Agent({ x: 5 }));

    const recorder = new Recorder(environment, {
      agent: {
        x: (agent) => agent.get("x"),
      },
      interval: "tick",
    });

    environment.tick();

    const json = recorder.toJSON("agent");

    expect(json).toEqual([{ time: 1, x: 5 }]);
  });

  it("Ignores duplicate record() calls in the same tick with warning", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    environment.addAgent(new Agent());

    const recorder = new Recorder(environment, {
      model: {
        count: (env) => env.getAgents().length,
      },
      interval: "manual",
    });

    environment.tick();

    recorder.record();
    recorder.record(); // Should be ignored
    recorder.record(); // Should be ignored

    const data = recorder.getModelData();

    expect(data.time.length).toBe(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("multiple times");

    warnSpy.mockRestore();
  });

  it("Handles metric errors gracefully", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    environment.addAgent(new Agent());

    const recorder = new Recorder(environment, {
      model: {
        good: () => 42,
        bad: () => {
          throw new Error("Metric error");
        },
      },
      interval: "tick",
    });

    environment.tick();

    const data = recorder.getModelData();

    expect(data.good).toEqual([42]);
    expect(data.bad).toEqual([null]); // Error results in null
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("Detaches from environment", () => {
    environment.addAgent(new Agent());

    const recorder = new Recorder(environment, {
      model: {
        count: (env) => env.getAgents().length,
      },
      interval: "tick",
    });

    environment.tick();
    expect(recorder.getModelData().time.length).toBe(1);

    recorder.detach();

    environment.tick();
    environment.tick();

    // Should not have recorded after detach
    expect(recorder.getModelData().time.length).toBe(1);
  });

  it("Works with default options", () => {
    environment.addAgent(new Agent());

    const recorder = new Recorder(environment);

    environment.tick();

    // Should have time recorded but no metrics
    const data = recorder.getModelData();
    expect(data.time).toEqual([1]);
    expect(Object.keys(data)).toEqual(["time"]);
  });

  it("Handles CSV special characters", () => {
    environment.addAgent(new Agent({ name: 'Has "quotes"' }));
    environment.addAgent(new Agent({ name: "Has,comma" }));
    environment.addAgent(new Agent({ name: "Has\nnewline" }));

    const recorder = new Recorder(environment, {
      agent: {
        name: (agent) => agent.get("name"),
      },
      interval: "tick",
    });

    environment.tick();

    const csv = recorder.toCSV("agent");
    const lines = csv.split("\n");

    expect(lines[0]).toBe("time,name");
    expect(lines[1]).toBe('1,"Has ""quotes"""');
    expect(lines[2]).toBe('1,"Has,comma"');
    // Line 3 will be split due to newline in value, but the value should be quoted
  });

  it("Environment automatically has EventBus", () => {
    const env = new Environment();
    expect(env.events).toBeDefined();
    expect(env.events.constructor.name).toBe("EventBus");
  });
});
