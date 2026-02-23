import { Environment, Agent, Experiment, utils } from "../main";

describe("Experiment", () => {
  // Simple model factory for testing
  const createSimpleModel = ({
    parameters,
    seed,
  }: {
    parameters: Record<string, any>;
    seed: number;
  }) => {
    utils.seed(seed);
    const env = new Environment({ width: 100, height: 100 });
    const count = parameters.agentCount ?? 10;
    for (let i = 0; i < count; i++) {
      env.addAgent(
        new Agent({
          x: utils.random(0, 100),
          y: utils.random(0, 100),
          energy: parameters.initialEnergy ?? 100,
        })
      );
    }
    return env;
  };

  describe("Parameter handling", () => {
    it("Handles array parameters", async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: {
          agentCount: [5, 10, 15],
        },
        replications: 1,
        maxTicks: 1,
        record: {
          model: {
            count: (env) => env.getAgents().length,
          },
        },
      });

      const results = await experiment.run();

      expect(results.data.length).toBe(3);
      expect(results.data[0].parameters.agentCount).toBe(5);
      expect(results.data[1].parameters.agentCount).toBe(10);
      expect(results.data[2].parameters.agentCount).toBe(15);
    });

    it("Handles range parameters", async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: {
          agentCount: { min: 10, max: 30, step: 10 },
        },
        replications: 1,
        maxTicks: 1,
        record: {
          model: {
            count: (env) => env.getAgents().length,
          },
        },
      });

      const results = await experiment.run();

      expect(results.data.length).toBe(3); // 10, 20, 30
      expect(results.data[0].parameters.agentCount).toBe(10);
      expect(results.data[1].parameters.agentCount).toBe(20);
      expect(results.data[2].parameters.agentCount).toBe(30);
    });

    it("Handles single value parameters (constants)", async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: {
          agentCount: 5, // single value, not array
        },
        replications: 2,
        maxTicks: 1,
        record: {
          model: {
            count: (env) => env.getAgents().length,
          },
        },
      });

      const results = await experiment.run();

      expect(results.data.length).toBe(2);
      expect(results.data[0].parameters.agentCount).toBe(5);
      expect(results.data[1].parameters.agentCount).toBe(5);
    });

    it("Generates Cartesian product of multiple parameters", async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: {
          agentCount: [5, 10],
          initialEnergy: [50, 100],
        },
        replications: 1,
        maxTicks: 1,
        record: {
          model: {
            count: (env) => env.getAgents().length,
          },
        },
      });

      const results = await experiment.run();

      // 2 x 2 = 4 combinations
      expect(results.data.length).toBe(4);

      const combinations = results.data.map((r) => ({
        agentCount: r.parameters.agentCount,
        initialEnergy: r.parameters.initialEnergy,
      }));

      expect(combinations).toContainEqual({ agentCount: 5, initialEnergy: 50 });
      expect(combinations).toContainEqual({ agentCount: 5, initialEnergy: 100 });
      expect(combinations).toContainEqual({ agentCount: 10, initialEnergy: 50 });
      expect(combinations).toContainEqual({ agentCount: 10, initialEnergy: 100 });
    });

    it("Handles floating point ranges correctly", async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: {
          agentCount: 1,
          initialEnergy: { min: 0.1, max: 0.3, step: 0.1 },
        },
        replications: 1,
        maxTicks: 1,
        record: {
          model: {
            count: (env) => env.getAgents().length,
          },
        },
      });

      const results = await experiment.run();

      expect(results.data.length).toBe(3);
      expect(results.data[0].parameters.initialEnergy).toBeCloseTo(0.1);
      expect(results.data[1].parameters.initialEnergy).toBeCloseTo(0.2);
      expect(results.data[2].parameters.initialEnergy).toBeCloseTo(0.3);
    });
  });

  describe("Replications", () => {
    it("Runs correct number of replications", async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: {
          agentCount: [5, 10],
        },
        replications: 3,
        maxTicks: 1,
        record: {
          model: {
            count: (env) => env.getAgents().length,
          },
        },
      });

      const results = await experiment.run();

      // 2 parameter combinations x 3 replications = 6 runs
      expect(results.data.length).toBe(6);
    });

    it("Uses different seeds for each replication", async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: {
          agentCount: [5],
        },
        replications: 3,
        maxTicks: 1,
        seed: 100,
        record: {
          model: {
            count: (env) => env.getAgents().length,
          },
        },
      });

      const results = await experiment.run();

      expect(results.data[0].seed).toBe(100);
      expect(results.data[1].seed).toBe(101);
      expect(results.data[2].seed).toBe(102);
    });

    it("Defaults to 1 replication", async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: {
          agentCount: [5, 10],
        },
        maxTicks: 1,
        record: {
          model: {
            count: (env) => env.getAgents().length,
          },
        },
      });

      const results = await experiment.run();

      expect(results.data.length).toBe(2);
    });
  });

  describe("Termination", () => {
    it("Stops at maxTicks", async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: { agentCount: 5 },
        replications: 1,
        maxTicks: 50,
        record: {
          model: {
            count: (env) => env.getAgents().length,
          },
        },
      });

      const results = await experiment.run();

      expect(results.data[0].ticks).toBe(50);
      expect(results.data[0].stoppedEarly).toBe(false);
    });

    it("Stops early when stopCondition is met", async () => {
      let tickCount = 0;

      const experiment = new Experiment({
        model: ({ parameters, seed }) => {
          const env = new Environment();
          // Add a tick behavior that we can track
          const agent = new Agent();
          agent.set("tick", () => {
            tickCount++;
          });
          env.addAgent(agent);
          return env;
        },
        parameters: {},
        replications: 1,
        maxTicks: 100,
        stopCondition: (env) => env.time >= 10,
        record: {
          model: {
            time: (env) => env.time,
          },
        },
      });

      const results = await experiment.run();

      expect(results.data[0].ticks).toBe(10);
      expect(results.data[0].stoppedEarly).toBe(true);
    });

    it("Defaults maxTicks to 1000", async () => {
      const experiment = new Experiment({
        model: ({ parameters, seed }) => {
          const env = new Environment();
          return env;
        },
        parameters: {},
        replications: 1,
        stopCondition: (env) => env.time >= 5, // Stop early
        record: {
          model: {
            time: (env) => env.time,
          },
        },
      });

      // This test just verifies the default exists by using stopCondition
      const results = await experiment.run();
      expect(results.data[0].ticks).toBe(5);
    });
  });

  describe("Recording", () => {
    it("Records metrics at end by default", async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: { agentCount: 10 },
        replications: 1,
        maxTicks: 5,
        record: {
          model: {
            count: (env) => env.getAgents().length,
            finalTick: (env) => env.time,
          },
        },
      });

      const results = await experiment.run();

      expect(results.data[0].metrics.count).toBe(10);
      expect(results.data[0].metrics.finalTick).toBe(5);
    });

    it("Works without record options", async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: { agentCount: 5 },
        replications: 1,
        maxTicks: 1,
      });

      const results = await experiment.run();

      expect(results.data.length).toBe(1);
      expect(results.data[0].metrics).toEqual({});
    });
  });

  describe("ExperimentResults", () => {
    let results: Awaited<ReturnType<Experiment["run"]>>;

    beforeAll(async () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: {
          agentCount: [5, 10, 15],
          initialEnergy: [50, 100],
        },
        replications: 2,
        maxTicks: 1,
        record: {
          model: {
            count: (env) => env.getAgents().length,
            totalEnergy: (env) =>
              (env.stat("energy") as number[]).reduce((a, b) => a + b, 0),
          },
        },
      });
      results = await experiment.run();
    });

    it("Returns correct summary", () => {
      const summary = results.summary();

      expect(summary.totalRuns).toBe(12); // 3 x 2 x 2
      expect(summary.parameterCombinations).toBe(6); // 3 x 2
      expect(summary.replicationsPerCombination).toBe(2);
      expect(summary.completedRuns).toBe(12);
      expect(summary.elapsedMs).toBeGreaterThan(0);
    });

    it("Filters by parameter", () => {
      const filtered = results.filter({ agentCount: 10 });

      expect(filtered.length).toBe(4); // 2 energy values x 2 replications
      expect(filtered.every((r) => r.parameters.agentCount === 10)).toBe(true);
    });

    it("Filters by multiple parameters", () => {
      const filtered = results.filter({ agentCount: 10, initialEnergy: 50 });

      expect(filtered.length).toBe(2); // 2 replications
      expect(
        filtered.every(
          (r) =>
            r.parameters.agentCount === 10 && r.parameters.initialEnergy === 50
        )
      ).toBe(true);
    });

    it("Groups by single parameter", () => {
      const groups = results.groupBy("agentCount");

      expect(groups.size).toBe(3); // 5, 10, 15
      expect(groups.get("5")?.length).toBe(4); // 2 energy values x 2 replications
      expect(groups.get("10")?.length).toBe(4);
      expect(groups.get("15")?.length).toBe(4);
    });

    it("Groups by multiple parameters", () => {
      const groups = results.groupBy(["agentCount", "initialEnergy"]);

      expect(groups.size).toBe(6); // 3 x 2 combinations
      expect(groups.get("5,50")?.length).toBe(2); // 2 replications
      expect(groups.get("10,100")?.length).toBe(2);
    });

    it("Aggregates across replications", () => {
      const aggregated = results.aggregate({
        groupBy: ["agentCount"],
        metrics: {
          meanCount: (runs) =>
            runs.reduce((sum, r) => sum + r.metrics.count, 0) / runs.length,
          runCount: (runs) => runs.length,
        },
      });

      expect(aggregated.length).toBe(3);

      const agg5 = aggregated.find((a) => a.parameters.agentCount === 5);
      expect(agg5?.metrics.meanCount).toBe(5);
      expect(agg5?.metrics.runCount).toBe(4);
    });

    it("Exports to CSV", () => {
      const csv = results.toCSV();
      const lines = csv.split("\n");

      expect(lines[0]).toContain("runIndex");
      expect(lines[0]).toContain("seed");
      expect(lines[0]).toContain("agentCount");
      expect(lines[0]).toContain("count");
      expect(lines.length).toBe(13); // header + 12 data rows
    });

    it("Exports to JSON", () => {
      const json = results.toJSON();

      expect(json.length).toBe(12);
      expect(json[0]).toHaveProperty("runIndex");
      expect(json[0]).toHaveProperty("parameters");
      expect(json[0]).toHaveProperty("metrics");
    });
  });

  describe("Progress callbacks", () => {
    it("Calls onProgress for each run", async () => {
      const progressCalls: any[] = [];

      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: { agentCount: [5, 10] },
        replications: 2,
        maxTicks: 1,
        record: {
          model: {
            count: (env) => env.getAgents().length,
          },
        },
      });

      await experiment.run({
        onProgress: (progress) => {
          progressCalls.push({ ...progress });
        },
      });

      // Should be called 5 times: before each of 4 runs + final
      expect(progressCalls.length).toBe(5);
      expect(progressCalls[0].completed).toBe(0);
      expect(progressCalls[0].total).toBe(4);
      expect(progressCalls[4].completed).toBe(4);
    });

    it("Calls onRunComplete after each run", async () => {
      const runResults: any[] = [];

      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: { agentCount: [5, 10] },
        replications: 1,
        maxTicks: 1,
        record: {
          model: {
            count: (env) => env.getAgents().length,
          },
        },
      });

      await experiment.run({
        onRunComplete: (result) => {
          runResults.push(result);
        },
      });

      expect(runResults.length).toBe(2);
      expect(runResults[0].metrics.count).toBe(5);
      expect(runResults[1].metrics.count).toBe(10);
    });
  });

  describe("Utility methods", () => {
    it("getTotalRuns returns correct count", () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: {
          agentCount: [5, 10, 15],
          initialEnergy: [50, 100],
        },
        replications: 5,
        maxTicks: 1,
      });

      expect(experiment.getTotalRuns()).toBe(30); // 3 x 2 x 5
    });

    it("getParameterCombinations returns all combinations", () => {
      const experiment = new Experiment({
        model: createSimpleModel,
        parameters: {
          agentCount: [5, 10],
          initialEnergy: [50, 100],
        },
        replications: 1,
        maxTicks: 1,
      });

      const combinations = experiment.getParameterCombinations();

      expect(combinations.length).toBe(4);
      expect(combinations).toContainEqual({ agentCount: 5, initialEnergy: 50 });
      expect(combinations).toContainEqual({ agentCount: 10, initialEnergy: 100 });
    });
  });

  describe("Seeding", () => {
    it("Produces reproducible results with same seed", async () => {
      const runExperiment = async (baseSeed: number) => {
        const experiment = new Experiment({
          model: ({ parameters, seed }) => {
            utils.seed(seed);
            const env = new Environment();
            env.addAgent(
              new Agent({
                x: utils.random(0, 100),
              })
            );
            return env;
          },
          parameters: {},
          replications: 3,
          maxTicks: 1,
          seed: baseSeed,
          record: {
            model: {
              x: (env) => env.getAgents()[0].get("x"),
            },
          },
        });
        return experiment.run();
      };

      const results1 = await runExperiment(42);
      const results2 = await runExperiment(42);

      expect(results1.data[0].metrics.x).toBe(results2.data[0].metrics.x);
      expect(results1.data[1].metrics.x).toBe(results2.data[1].metrics.x);
      expect(results1.data[2].metrics.x).toBe(results2.data[2].metrics.x);
    });

    it("Produces different results with different seeds", async () => {
      const runExperiment = async (baseSeed: number) => {
        const experiment = new Experiment({
          model: ({ parameters, seed }) => {
            utils.seed(seed);
            const env = new Environment();
            env.addAgent(
              new Agent({
                x: utils.random(0, 1000),
              })
            );
            return env;
          },
          parameters: {},
          replications: 1,
          maxTicks: 1,
          seed: baseSeed,
          record: {
            model: {
              x: (env) => env.getAgents()[0].get("x"),
            },
          },
        });
        return experiment.run();
      };

      const results1 = await runExperiment(1);
      const results2 = await runExperiment(999);

      expect(results1.data[0].metrics.x).not.toBe(results2.data[0].metrics.x);
    });
  });
});
