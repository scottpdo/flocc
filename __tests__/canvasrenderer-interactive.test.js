const { Agent, Environment, CanvasRenderer } = require("../dist/flocc");

// Mock devicePixelRatio
Object.defineProperty(window, "devicePixelRatio", { value: 1 });

let environment, renderer;

beforeEach(() => {
  environment = new Environment();
});

describe("CanvasRenderer interactive features", () => {
  describe("when interactive is false (default)", () => {
    it("does not have interactive listeners", () => {
      renderer = new CanvasRenderer(environment, {
        width: 100,
        height: 100,
        background: "white"
      });
      expect(renderer.opts.interactive).toBeFalsy();
      expect(renderer.selected).toEqual([]);
    });
  });

  describe("when interactive is true", () => {
    beforeEach(() => {
      renderer = new CanvasRenderer(environment, {
        width: 100,
        height: 100,
        background: "white",
        interactive: true
      });
    });

    it("sets interactive to true in opts", () => {
      expect(renderer.opts.interactive).toBe(true);
    });

    it("initializes selected as an empty array", () => {
      expect(renderer.selected).toEqual([]);
    });

    it("supports on() for registering event listeners", () => {
      const callback = jest.fn();
      renderer.on("click", callback);
      // Should not throw
      expect(typeof renderer.on).toBe("function");
    });

    it("supports on() for hover events", () => {
      const hoverCallback = jest.fn();
      const unhoverCallback = jest.fn();
      renderer.on("hover", hoverCallback);
      renderer.on("unhover", unhoverCallback);
      expect(typeof renderer.on).toBe("function");
    });
  });

  describe("hit testing (_agentAtPoint)", () => {
    beforeEach(() => {
      renderer = new CanvasRenderer(environment, {
        width: 100,
        height: 100,
        background: "white",
        interactive: true,
        scale: 1,
        origin: { x: 0, y: 0 }
      });
      // Mock getBoundingClientRect
      renderer.canvas.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100
      });
    });

    it("returns null when no agents exist", () => {
      expect(renderer._agentAtPoint(50, 50)).toBeNull();
    });

    it("detects a circle agent at its position", () => {
      const agent = new Agent({ x: 50, y: 50, size: 10 });
      environment.addAgent(agent);
      expect(renderer._agentAtPoint(50, 50)).toBe(agent);
    });

    it("returns null when clicking outside an agent", () => {
      const agent = new Agent({ x: 50, y: 50, size: 5 });
      environment.addAgent(agent);
      expect(renderer._agentAtPoint(0, 0)).toBeNull();
    });

    it("detects a rect agent at its position", () => {
      const agent = new Agent({ x: 50, y: 50, shape: "rect", width: 20, height: 20 });
      environment.addAgent(agent);
      // Center of the rect should hit
      expect(renderer._agentAtPoint(50, 50)).toBe(agent);
    });

    it("detects a triangle agent at its position", () => {
      const agent = new Agent({ x: 50, y: 50, shape: "triangle", size: 20 });
      environment.addAgent(agent);
      expect(renderer._agentAtPoint(50, 50)).toBe(agent);
    });

    it("returns the topmost agent when agents overlap", () => {
      const agent1 = new Agent({ x: 50, y: 50, size: 10 });
      const agent2 = new Agent({ x: 50, y: 50, size: 10 });
      environment.addAgent(agent1);
      environment.addAgent(agent2);
      // agent2 added last, drawn on top, should be returned
      expect(renderer._agentAtPoint(50, 50)).toBe(agent2);
    });
  });

  describe("zoom options", () => {
    it("defaults zoomMin to 0.1 and zoomMax to 10", () => {
      renderer = new CanvasRenderer(environment, {
        width: 100,
        height: 100,
        background: "white",
        interactive: true
      });
      expect(renderer.opts.zoomMin).toBe(0.1);
      expect(renderer.opts.zoomMax).toBe(10);
    });

    it("respects custom zoomMin and zoomMax", () => {
      renderer = new CanvasRenderer(environment, {
        width: 100,
        height: 100,
        background: "white",
        interactive: true,
        zoomMin: 0.5,
        zoomMax: 5
      });
      expect(renderer.opts.zoomMin).toBe(0.5);
      expect(renderer.opts.zoomMax).toBe(5);
    });
  });

  describe("onSelect callback", () => {
    it("stores onSelect in opts", () => {
      const onSelect = jest.fn();
      renderer = new CanvasRenderer(environment, {
        width: 100,
        height: 100,
        background: "white",
        interactive: true,
        onSelect
      });
      expect(renderer.opts.onSelect).toBe(onSelect);
    });
  });
});

describe("Environment pause/step controls", () => {
  it("starts in playing state", () => {
    expect(environment.playing).toBe(true);
  });

  it("pause() sets playing to false", () => {
    environment.pause();
    expect(environment.playing).toBe(false);
  });

  it("resume() sets playing to true", () => {
    environment.pause();
    environment.resume();
    expect(environment.playing).toBe(true);
  });

  it("toggle() switches playing state", () => {
    expect(environment.playing).toBe(true);
    environment.toggle();
    expect(environment.playing).toBe(false);
    environment.toggle();
    expect(environment.playing).toBe(true);
  });

  it("tick() does nothing when paused", () => {
    environment.pause();
    environment.tick();
    expect(environment.time).toEqual(0);
  });

  it("step() advances one tick even when paused", () => {
    environment.pause();
    environment.step();
    expect(environment.time).toEqual(1);
    // Should still be paused after step
    expect(environment.playing).toBe(false);
  });

  it("step() executes agent rules when paused", () => {
    const agent = new Agent();
    const rule = jest.fn();
    agent.addRule(rule);
    environment.addAgent(agent);
    environment.pause();
    environment.step();
    expect(rule).toHaveBeenCalledTimes(1);
  });

  it("tick() still works normally when playing", () => {
    environment.tick();
    expect(environment.time).toEqual(1);
    environment.tick();
    expect(environment.time).toEqual(2);
  });

  it("step() works when not paused too", () => {
    environment.step();
    expect(environment.time).toEqual(1);
    expect(environment.playing).toBe(true);
  });
});
