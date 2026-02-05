const {
  Agent,
  Environment,
  EventBus,
  DefaultScheduler,
  PriorityScheduler,
  PriorityQueue,
} = require("../dist/flocc.js");

describe("PriorityQueue", () => {
  it("maintains min-heap property", () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.insert(5);
    pq.insert(3);
    pq.insert(7);
    pq.insert(1);

    expect(pq.pop()).toBe(1);
    expect(pq.pop()).toBe(3);
    expect(pq.pop()).toBe(5);
    expect(pq.pop()).toBe(7);
    expect(pq.pop()).toBeUndefined();
  });

  it("handles custom comparator", () => {
    const pq = new PriorityQueue((a, b) => a.priority - b.priority);
    pq.insert({ name: "low", priority: 10 });
    pq.insert({ name: "high", priority: 1 });
    pq.insert({ name: "mid", priority: 5 });

    expect(pq.pop().name).toBe("high");
    expect(pq.pop().name).toBe("mid");
    expect(pq.pop().name).toBe("low");
  });

  it("supports remove", () => {
    const pq = new PriorityQueue();
    pq.insert(1);
    pq.insert(2);
    pq.insert(3);

    expect(pq.remove(2)).toBe(true);
    expect(pq.size).toBe(2);
    expect(pq.remove(99)).toBe(false);
  });
});

describe("EventBus", () => {
  it("emits and receives events", () => {
    const events = new EventBus();
    const received = [];

    events.on("test", (event) => {
      received.push(event.data);
    });

    events.emit("test", "hello");
    events.emit("test", "world");

    expect(received).toEqual(["hello", "world"]);
  });

  it("supports unsubscribe", () => {
    const events = new EventBus();
    const received = [];

    const unsubscribe = events.on("test", (event) => {
      received.push(event.data);
    });

    events.emit("test", 1);
    unsubscribe();
    events.emit("test", 2);

    expect(received).toEqual([1]);
  });

  it("supports once", () => {
    const events = new EventBus();
    const received = [];

    events.once("test", (event) => {
      received.push(event.data);
    });

    events.emit("test", 1);
    events.emit("test", 2);

    expect(received).toEqual([1]);
  });

  it("supports stopPropagation", () => {
    const events = new EventBus();
    const received = [];

    events.on("test", (event) => {
      received.push("first");
      event.stopPropagation();
    });

    events.on("test", (event) => {
      received.push("second");
    });

    events.emit("test", null);

    expect(received).toEqual(["first"]);
  });

  it("provides event metadata", () => {
    const events = new EventBus();
    const env = new Environment({ events });
    env.time = 42;

    let receivedEvent = null;
    events.on("test", (event) => {
      receivedEvent = event;
    });

    events.emit("test", { foo: "bar" }, env);

    expect(receivedEvent.type).toBe("test");
    expect(receivedEvent.data).toEqual({ foo: "bar" });
    expect(receivedEvent.source).toBe(env);
    expect(receivedEvent.time).toBe(42);
  });
});

describe("DefaultScheduler", () => {
  it("schedules agents with default interval", () => {
    const scheduler = new DefaultScheduler();
    const env = new Environment({ scheduler });

    const agent = new Agent();
    env.addAgent(agent);

    // Should tick every time
    expect(scheduler.getAgentsForTick(0)).toContain(agent);
    expect(scheduler.getAgentsForTick(1)).toContain(agent);
    expect(scheduler.getAgentsForTick(2)).toContain(agent);
  });

  it("respects tickInterval", () => {
    const scheduler = new DefaultScheduler();
    const env = new Environment({ scheduler });

    const agent = new Agent({ tickInterval: 3 });
    env.addAgent(agent);

    // Ticks at 0, 3, 6, 9...
    expect(scheduler.getAgentsForTick(0)).toContain(agent);
    expect(scheduler.getAgentsForTick(1)).not.toContain(agent);
    expect(scheduler.getAgentsForTick(2)).not.toContain(agent);
    expect(scheduler.getAgentsForTick(3)).toContain(agent);
    expect(scheduler.getAgentsForTick(6)).toContain(agent);
  });

  it("removes agent on removeAgent", () => {
    const scheduler = new DefaultScheduler();
    const env = new Environment({ scheduler });

    const agent = new Agent();
    env.addAgent(agent);
    expect(scheduler.getAgentsForTick(0)).toContain(agent);

    env.removeAgent(agent);
    expect(scheduler.getAgentsForTick(0)).not.toContain(agent);
  });
});

describe("PriorityScheduler", () => {
  it("schedules agents at specific times", () => {
    const scheduler = new PriorityScheduler();
    const env = new Environment({ scheduler });

    const agent1 = new Agent();
    const agent2 = new Agent();
    env.addAgent(agent1);
    env.addAgent(agent2);

    // Both scheduled for time 1 by default
    scheduler.schedule(agent1, 5);
    scheduler.schedule(agent2, 10);

    expect(scheduler.nextScheduledTime()).toBe(5);
    expect(scheduler.getAgentsForTick(5)).toEqual([agent1]);
    expect(scheduler.nextScheduledTime()).toBe(10);
    expect(scheduler.getAgentsForTick(10)).toEqual([agent2]);
    expect(scheduler.nextScheduledTime()).toBe(null);
  });

  it("supports agent self-scheduling", () => {
    const scheduler = new PriorityScheduler();
    const env = new Environment({ scheduler });

    let tickCount = 0;
    const agent = new Agent({
      tick: (a) => {
        tickCount++;
        if (tickCount < 3) {
          a.scheduleIn(5);
        }
      },
    });
    env.addAgent(agent);
    scheduler.schedule(agent, 0);

    // First tick at time 0
    env.tickNext();
    expect(tickCount).toBe(1);
    expect(env.time).toBe(0);

    // Second tick at time 5
    env.tickNext();
    expect(tickCount).toBe(2);
    expect(env.time).toBe(5);

    // Third tick at time 10
    env.tickNext();
    expect(tickCount).toBe(3);
    expect(env.time).toBe(10);

    // No more scheduled
    expect(scheduler.nextScheduledTime()).toBe(null);
  });
});

describe("Environment with EventBus", () => {
  it("emits tick:start and tick:end events", () => {
    const events = new EventBus();
    const env = new Environment({ events });
    const received = [];

    events.on("tick:start", (e) => received.push(`start:${e.data.time}`));
    events.on("tick:end", (e) => received.push(`end:${e.data.time}`));

    env.tick();

    expect(received).toEqual(["start:0", "end:1"]);
  });

  it("emits agent:added and agent:removed events", () => {
    const events = new EventBus();
    const env = new Environment({ events });
    const received = [];

    events.on("agent:added", (e) => received.push(`added:${e.data.agent.id}`));
    events.on("agent:removed", (e) => received.push(`removed:${e.data.agent.id}`));

    const agent = new Agent();
    env.addAgent(agent);
    env.removeAgent(agent);

    expect(received).toEqual([`added:${agent.id}`, `removed:${agent.id}`]);
  });
});

describe("Agent events", () => {
  it("can subscribe to events via agent.on", () => {
    const events = new EventBus();
    const env = new Environment({ events });
    const received = [];

    const agent = new Agent();
    env.addAgent(agent);

    agent.on("custom:event", (a, event) => {
      received.push({ agent: a.id, data: event.data });
    });

    events.emit("custom:event", "test-data");

    expect(received.length).toBe(1);
    expect(received[0].agent).toBe(agent.id);
    expect(received[0].data).toBe("test-data");
  });

  it("can emit events via agent.emit", () => {
    const events = new EventBus();
    const env = new Environment({ events });
    const received = [];

    const agent = new Agent();
    env.addAgent(agent);

    events.on("agent:signal", (event) => {
      received.push(event.data);
    });

    agent.emit("agent:signal", { message: "hello" });

    expect(received).toEqual([{ message: "hello" }]);
  });
});

describe("Environment.tickNext", () => {
  it("jumps to next scheduled time", () => {
    const scheduler = new PriorityScheduler();
    const env = new Environment({ scheduler });

    const agent = new Agent({ tick: () => {} });
    env.addAgent(agent);
    scheduler.schedule(agent, 100);

    const nextTime = env.tickNext();

    expect(nextTime).toBe(100);
    expect(env.time).toBe(100);
  });

  it("returns null when nothing is scheduled", () => {
    const scheduler = new PriorityScheduler();
    const env = new Environment({ scheduler });

    expect(env.tickNext()).toBe(null);
  });
});

describe("Environment.tickUntil", () => {
  it("runs until target time", () => {
    const scheduler = new PriorityScheduler();
    const env = new Environment({ scheduler });
    let tickCount = 0;

    const agent = new Agent({
      tick: (a) => {
        tickCount++;
        a.scheduleIn(10);
      },
    });
    env.addAgent(agent);
    scheduler.schedule(agent, 0);

    env.tickUntil(50);

    // Should have ticked at 0, 10, 20, 30, 40, 50
    expect(tickCount).toBe(6);
    expect(env.time).toBe(50);
  });
});

describe("Environment.scheduleAction", () => {
  it("schedules a one-time action", () => {
    const events = new EventBus();
    const env = new Environment({ events });
    let executed = false;

    env.scheduleAction(5, () => {
      executed = true;
    });

    env.tick(); // time 1
    env.tick(); // time 2
    env.tick(); // time 3
    env.tick(); // time 4
    expect(executed).toBe(false);

    env.tick(); // time 5
    expect(executed).toBe(true);
  });
});
