/// <reference path="../agents/Agent.d.ts" />
/// <reference path="../types/Data.d.ts" />
/// <reference path="../renderers/Renderer.d.ts" />

type NewRule = (agent: Agent) => Data;

class NewEnvironment {
  agents: number = 0;
  current: number = 0;
  data: Map<string, any[]> = new Map();
  helpers: { network: any } = { network: null };
  nextData: Map<string, any[]> = new Map();
  rule: NewRule;
  renderers: Renderer[] = [];

  addAgent(data: Data): Agent {
    const index = this.agents++;
    if (data) this.set(index, data);
    return this.getAgent(index);
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
}

export { NewEnvironment };
