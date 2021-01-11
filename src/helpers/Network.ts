/// <reference path="../environments/EnvironmentHelper.d.ts" />
import { Agent } from "../agents/Agent";
import { Environment } from "../environments/Environment";
import shuffle from "../utils/shuffle";
import { NumArray } from "./NumArray";

interface AgentCallback {
  (agent: Agent, index: number): any;
}

class Network implements EnvironmentHelper {
  adjacencyList: Map<Agent, Agent[]> = new Map();
  adjacencyMatrix: NumArray = new NumArray();

  /**
   * list (JS array) of all the agents
   * in the order they were added to the graph
   */
  agents: Agent[] = [];

  /**
   * Add an agent to the network.
   * Returns `true` if the agent was successfully added.
   * Returns `false` if the agent was already in the network.
   * @param {Agent} agent
   */
  addAgent(agent: Agent): boolean {
    if (!this.isInNetwork(agent)) {
      this.adjacencyList.set(agent, []);
      this.agents.push(agent);
      this._resetAdjacencyMatrix();
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
    this.adjacencyList.delete(agent);

    const idx = this.indexOf(agent);
    if (idx >= 0) this.agents.splice(idx, 1);

    this._resetAdjacencyMatrix();

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

    if (!this.areConnected(a1, a2)) {
      this.adjacencyList.get(a1).push(a2);
      this.adjacencyList.get(a2).push(a1);

      const i1 = this.indexOf(a1);
      const i2 = this.indexOf(a2);
      this.adjacencyMatrix.set(i1 * this.size() + i2, 1);
      this.adjacencyMatrix.set(i2 * this.size() + i1, 1);
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
    if (!this.isInNetwork(a1) || !this.isInNetwork(a2)) return false;
    const i1 = this.indexOf(a1);
    const i2 = this.indexOf(a2);
    return (
      this.adjacencyMatrix.get(i1 * this.size() + i2) === 1 &&
      this.adjacencyMatrix.get(i2 * this.size() + i1) === 1
    );
  }

  /**
   * Like with connect, returns `true` if the edge was successfully
   * removed, false if otherwise (if edge did not exist in the first place).
   * @param {agent} a1
   * @param {agent} a2
   */
  disconnect(a1: Agent, a2: Agent): boolean {
    if (a1 === a2) return false;

    const a1neighbors = this.adjacencyList.get(a1);
    const a2neighbors = this.adjacencyList.get(a2);

    if (this.areConnected(a1, a2)) {
      a1neighbors.splice(a1neighbors.indexOf(a2), 1);
      a2neighbors.splice(a2neighbors.indexOf(a1), 1);

      const i1 = this.indexOf(a1);
      const i2 = this.indexOf(a2);
      this.adjacencyMatrix.set(i1 * this.size() + i2, 0);
      this.adjacencyMatrix.set(i2 * this.size() + i1, 0);
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
    return this.adjacencyList.has(agent);
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
    return this.adjacencyList.get(agent);
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

  _resetAdjacencyMatrix(): void {
    this.adjacencyMatrix = new NumArray();
    for (let i = 0; i < this.size(); i++) {
      for (let j = 0; j < this.size(); j++) {
        const connected = this.areConnected(this.get(i), this.get(j));
        this.adjacencyMatrix.push(connected ? 1 : 0);
      }
    }
  }

  _globalClusteringCoefficient(): number {
    return 0;
  }

  clusteringCoefficient(agent?: Agent): number {
    if (!agent) return this._globalClusteringCoefficient();

    if (agent && !this.isInNetwork(agent)) return null;

    const neighbors = this.neighbors(agent);
    if (neighbors.length === 0) return null;
    const k = neighbors.length;

    let clusterConnections = 0;
    for (let i = 0; i < k - 1; i++) {
      const a = neighbors[i];
      for (let j = i + 1; j < k; j++) {
        const b = neighbors[j];
        if (this.areConnected(a, b)) clusterConnections++;
      }
    }

    return (2 * clusterConnections) / (k * (k - 1));
  }
}

export { Network };
