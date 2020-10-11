/// <reference path="../environments/EnvironmentHelper.d.ts" />
import { Agent } from "../agents/Agent";
import { Environment } from "../environments/Environment";
import shuffle from "../utils/shuffle";

interface AdjacencyList {
  [id: string]: Agent[];
}

interface AgentCallback {
  (agent: Agent, index: number): any;
}

class Network implements EnvironmentHelper {
  /**
   * keys = IDs of agents in the network,
   * values = array of neighboring agents
   */
  data: AdjacencyList;

  /**
   * list (JS array) of all the agents
   * in the order they were added to the graph
   */
  agents: Agent[];

  constructor() {
    this.data = {};
    this.agents = [];
  }

  /**
   * Add an agent to the network.
   * Returns `true` if the agent was successfully added.
   * Returns `false` if the agent was already in the network.
   * @param {Agent} agent
   */
  addAgent(agent: Agent): boolean {
    if (!this.isInNetwork(agent)) {
      this.data[agent.id] = [];
      this.agents.push(agent);
      return true;
    }
    return false;
  }

  /**
   * Add all agents in an environment to this network.
   * @param {Environment} environment
   */
  addFromEnvironment(environment: Environment): void {
    environment.getAgents().forEach(agent => this.addAgent(agent));
  }

  /**
   * Remove an agent from the network.
   * Returns `true` if the agent was successfully removed.
   * Returns `false` if the agent was not in the network to begin with.
   * @param {Agent} agent
   */
  removeAgent(agent: Agent): boolean {
    if (!this.isInNetwork(agent)) return false;

    if (this.neighbors(agent)) {
      this.neighbors(agent).forEach(neighbor => {
        this.disconnect(agent, neighbor);
      });
    }
    delete this.data[agent.id];

    const idx = this.indexOf(agent);
    if (idx >= 0) this.agents.splice(idx, 1);

    return true;
  }

  /**
   * Removes all agents from the network.
   */
  clear(): void {
    while (this.agents.length > 0) {
      const a0 = this.agents[0];
      this.removeAgent(a0);
    }
  }

  /**
   * Returns true if successfully connected the two agents, false otherwise
   * (for example, if tried to add an edge between an agent + itself
   * or if the connection already exists).
   * @param {*} a1
   * @param {*} a2
   */
  connect(a1: Agent, a2: Agent): boolean {
    if (a1 === a2) return false;
    if (!this.isInNetwork(a1) || !this.isInNetwork(a2)) return false;

    const id1 = a1.id;
    const id2 = a2.id;

    if (!this.areConnected(a1, a2)) {
      this.data[id1].push(a2);
      this.data[id2].push(a1);
      return true;
    }

    return false;
  }

  /**
   * Returns `true` if the given agents are connected in the network.
   * @param {Agent} a1
   * @param {Agent} a2
   */
  areConnected(a1: Agent, a2: Agent): boolean {
    const id1 = a1.id;
    const id2 = a2.id;
    if (!this.isInNetwork(a1) || !this.isInNetwork(a2)) return false;
    return this.data[id1].indexOf(a2) >= 0 && this.data[id2].indexOf(a1) >= 0;
  }

  /**
   * Like with connect, returns `true` if the edge was successfully
   * removed, false if otherwise (if edge did not exist in the first place).
   * @param {agent} a1
   * @param {agent} a2
   */
  disconnect(a1: Agent, a2: Agent): boolean {
    if (a1 === a2) return false;

    const id1 = a1.id;
    const id2 = a2.id;

    if (this.areConnected(a1, a2)) {
      this.data[id1].splice(this.data[id1].indexOf(a2), 1);
      this.data[id2].splice(this.data[id2].indexOf(a1), 1);
      return true;
    }

    return false;
  }

  /**
   * Number of agents in the network.
   */
  size(): number {
    return this.agents.length;
  }

  /**
   * Given a callback function, loop over all the agents in the network
   * and invoke the callback, passing the agent + its index as parameters.
   * @param {Function} cb
   */
  forEach(cb: AgentCallback) {
    this.agents.forEach(cb);
  }

  /**
   * Same as forEach, but in random order.
   * @param {Function} cb
   */
  forEachRand(cb: AgentCallback) {
    shuffle(this.agents).forEach(cb);
  }

  /**
   * Returns true if the agent is in the network, false if it is not.
   * @param {Agent} agent
   */
  isInNetwork(agent: Agent): boolean {
    return this.agents.indexOf(agent) > -1;
  }

  /**
   * Get the agent at index i.
   * @param {number} i
   */
  get(i: number): Agent {
    while (i < 0) i += this.size();
    while (i >= this.size()) i -= this.size();
    return this.agents[i];
  }

  /**
   * Get the index of a given agent.
   * @param {Agent} agent
   */
  indexOf(agent: Agent): number {
    return this.agents.indexOf(agent);
  }

  /**
   * Return the agents that are neighbors of a given agent
   * (in a JS array). If the agent is not in the network, returns `null`.
   * @param {Agent} agent
   */
  neighbors(agent: Agent): Agent[] | null {
    if (!this.isInNetwork(agent)) return null;
    return this.data[agent.id];
  }

  /**
   * Connect every agent in the network to every other agent.
   */
  complete(): void {
    for (let i = 0; i < this.agents.length; i++) {
      for (let j = i + 1; j < this.agents.length; j++) {
        this.connect(this.get(i), this.get(j));
      }
    }
  }
}

export { Network };
