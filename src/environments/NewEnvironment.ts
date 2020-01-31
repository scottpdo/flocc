/// <reference path="../agents/Agent.d.ts" />
/// <reference path="../types/Data.d.ts" />
/// <reference path="../renderers/Renderer.d.ts" />
/// <reference path="./EnvironmentOptions.d.ts" />

import { Network } from "../helpers/Network";
import shuffle from "../utils/shuffle";
import uuid from "../utils/uuid";
import { KDTree } from "../helpers/KDTree";

type NewRule = (agent: Agent) => Data;

interface Helpers {
  kdtree: KDTree;
  network: Network;
}

const defaultEnvironmentOptions: EnvironmentOptions = {
  torus: true,
  height: 0,
  width: 0
};

class NewEnvironment {
  agents: number = 0;
  current: number = 0;
  data: Map<string, any[]> = new Map();
  ids: string[] = [];
  idsToIndices: { [key: string]: number } = {};
  helpers: Helpers = { network: null, kdtree: null };
  opts: EnvironmentOptions;
  nextData: Map<string, any[]> = new Map();
  rule: NewRule;
  renderers: Renderer[] = [];
  width: number;
  height: number;
  time: number = 0;

  constructor(opts: EnvironmentOptions = defaultEnvironmentOptions) {
    this.opts = Object.assign({}, defaultEnvironmentOptions, opts);
    this.width = this.opts.width;
    this.height = this.opts.height;
  }

  addAgent(data: Data): Agent {
    const index = this.agents++;
    const id = uuid();
    this.ids.push(id);
    this.idsToIndices[id] = index;
    if (data) this.set(index, data);
    return this.getAgent(index);
  }

  /**
   * Remove an agent from the environment.
   * @param {Agent} agent
   */
  removeAgent(agent: Agent): void {
    this.removeAgentById(agent.id);
  }

  /**
   * Remove an agent from the environment by its ID.
   * @param {string} id
   */
  removeAgentById(id: string): void {
    const index = this.idsToIndices[id];
    this.agents--;
    delete this.idsToIndices[id];
    this.ids.splice(index, 1);
  }

  get(i: number, key: string): any {
    if (i >= this.agents) return null;
    if (!this.data.get(key)) return null;
    const value = this.data.get(key)[i];
    if (typeof value === "undefined") return null;
    return value;
  }

  getData(i: number): Data {
    const data: Data = {};
    Array.from(this.data.keys()).forEach(key => {
      data[key] = this.data.get(key)[i];
    });
    return data;
  }

  set(i: number, key: string | Data, value?: any): void {
    if (typeof key === "string") {
      if (!this.data.get(key)) this.data.set(key, []);
      if (this.opts.torus) {
        const { width, height } = this;
        if (key === "x" && value > width) value -= width;
        if (key === "x" && value < 0) value += width;
        if (key === "y" && value > height) value -= height;
        if (key === "y" && value < 0) value += height;
      }
      this.data.get(key)[i] = value;
    } else {
      for (let name in key) {
        this.set(i, name, key[name]);
      }
    }
  }

  increment(i: number, key: string, n: number): void {
    if (!this.get(i, key)) this.set(i, key, 0);
    this.set(i, key, this.get(i, key) + n);
  }

  decrement(i: number, key: string, n: number): void {
    this.increment(i, key, -n);
  }

  enqueue(i: number, data: Data): void {
    if (!data) return;
    for (let key in data) {
      if (!this.nextData.get(key)) this.nextData.set(key, []);
      this.nextData.get(key)[i] = data[key];
    }
  }

  getAgent(i: number): Agent {
    if (i >= this.agents) return null;
    return {
      environment: this,
      id: this.ids[i],
      get: (key: string) => this.get(i, key),
      getData: () => this.getData(i),
      set: (key: string | Data, value?: any) => this.set(i, key, value),
      increment: (key: string, n: number = 1) => this.increment(i, key, n),
      decrement: (key: string, n: number = 1) => this.decrement(i, key, n)
    };
  }

  getAgents(): Agent[] {
    const agents = [];
    for (let i = 0; i < this.agents; i++) {
      agents.push(this.getAgent(i));
    }
    return agents;
  }

  getAgentById(id: string): Agent {
    const i = this.idsToIndices[id];
    return this.getAgent(i);
  }

  /**
   * Removes all agents from the environment.
   */
  clear(): void {
    while (this.getAgents().length > 0) {
      const a0 = this.getAgents()[0];
      this.removeAgent(a0);
    }
  }

  addRule(rule: NewRule) {
    this.rule = (agent: Agent): Data => {
      const data = rule(agent);
      this.current++;
      return data || null;
    };
  }

  tick(n: number = 1): void {
    if (this.rule) {
      while (this.current < this.agents) {
        this.enqueue(this.current, this.rule(this.getAgent(this.current)));
      }
      // update current data with next data
      Array.from(this.nextData.keys()).forEach(key => {
        this.data.set(key, Array.from(this.nextData.get(key)));
      });
      // reset current agent
      this.current = 0;
    }

    if (n > 1) return this.tick(n - 1);

    this.renderers.forEach(r => r.render());
  }

  /**
   * Use a helper with this environment.
   * @param {EnvironmentHelper} e
   */
  use(e: EnvironmentHelper) {
    if (e instanceof KDTree) {
      e.environment = this;
      this.helpers.kdtree = e;
    }
    if (e instanceof Network) this.helpers.network = e;
  }
}

export { NewEnvironment };
