/// <reference path="../environments/EnvironmentHelper.d.ts" />
import { Agent } from "../agents/Agent";
import { Environment } from "../environments/Environment";
import mean from "../utils/mean";
import shuffle from "../utils/shuffle";
import { Array2D } from "./Array2D";

interface AgentCallback {
  (agent: Agent, index: number): any;
}

class Network implements EnvironmentHelper {
  adjacencyList: Map<Agent, Agent[]> = new Map();
  // instantiated and updated in _resetAdjacencyMatrix
  adjacencyMatrix: Array2D = null;

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
      this.adjacencyMatrix.set(i1, i2, 1);
      this.adjacencyMatrix.set(i2, i1, 1);
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
      this.adjacencyMatrix.get(i1, i2) === 1 &&
      this.adjacencyMatrix.get(i2, i1) === 1
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

    if (this.areConnected(a1, a2)) {
      const a1neighbors = this.adjacencyList.get(a1);
      const a2neighbors = this.adjacencyList.get(a2);
      a1neighbors.splice(a1neighbors.indexOf(a2), 1);
      a2neighbors.splice(a2neighbors.indexOf(a1), 1);

      const i1 = this.indexOf(a1);
      const i2 = this.indexOf(a2);
      this.adjacencyMatrix.set(i1, i2, 0);
      this.adjacencyMatrix.set(i2, i1, 0);
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

  /**
   * Internal helper function to reset the adjacencyMatrix.
   * This gets called when agents are added to or removed from the network.
   */
  _resetAdjacencyMatrix(): void {
    const size = this.size();
    const newMatrix = new Array2D(size, size);
    // only copy values if there is already an adjacencyMatrix
    if (this.adjacencyMatrix !== null) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const connected = this.areConnected(this.get(x), this.get(y));
          newMatrix.set(x, y, connected ? 1 : 0);
        }
      }
    }
    this.adjacencyMatrix = newMatrix;
  }

  /**
   * Returns `true` if a, b, and c are a 'triplet' of agents --
   * if (at least) one of the three is connected to the other two.
   * @param {Agent} a
   * @param {Agent} b
   * @param {Agent} c
   * @since 0.5.17
   */
  isTriplet(a: Agent, b: Agent, c: Agent): boolean {
    if (a === b || a === c || b === c) return false;
    const connections = [
      this.areConnected(a, b),
      this.areConnected(a, c),
      this.areConnected(b, c)
    ].filter(v => v).length;
    return connections >= 2;
  }

  /**
   * Returns `true` if a, b, and c are a 'closed triplet' of agents --
   * each connected to the other two.
   * @param {Agent} a
   * @param {Agent} b
   * @param {Agent} c
   * @since 0.5.17
   */
  isClosedTriplet(a: Agent, b: Agent, c: Agent): boolean {
    if (a === b || a === c || b === c) return false;
    const connections = [
      this.areConnected(a, b),
      this.areConnected(a, c),
      this.areConnected(b, c)
    ].filter(v => v).length;
    return connections === 3;
  }

  _globalClusteringCoefficient(): number {
    let triplets = 0;
    let closedTriplets = 0;
    this.forEach((agent, i) => {
      const neighbors = this.neighbors(agent);
      if (neighbors.length < 2) return;
      for (let j = 0; j < neighbors.length - 1; j++) {
        for (let k = 1; k < neighbors.length; k++) {
          const [b, c] = [neighbors[j], neighbors[k]];
          if (this.isTriplet(agent, b, c)) triplets++;
          if (this.isClosedTriplet(agent, b, c)) closedTriplets++;
        }
      }
    });
    return closedTriplets / triplets;
  }

  /**
   * If an agent is passed as the single parameter, returns the local
   * clustering coefficient for that agent (a measure of how connected that
   * agent's neighbors are to each other).
   * If no parameter is passed, returns the global clustering coefficient
   * of the network (an aggregate measure of how connected are the agents).
   * @param {Agent} [agent]
   * @since 0.5.17
   */
  clusteringCoefficient(agent?: Agent): number {
    if (!agent) return this._globalClusteringCoefficient();

    if (agent && !this.isInNetwork(agent)) return null;

    const neighbors = this.neighbors(agent);
    if (neighbors.length < 2) return null;

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

  /**
   * Returns the average clustering coefficient for the network (the average
   * of the local clustering coefficient across all agents). Note that
   * this is a different measurement from the _global_ clustering coefficient.
   * @since 0.5.17
   */
  averageClusteringCoefficient(): number {
    // get clusteringCoefficients for all agents,
    // removing null values (those with too few neighbors)
    const coefficients = this.agents
      .map(a => this.clusteringCoefficient(a))
      .filter(v => v !== null);
    return mean(coefficients);
  }
}

export { Network };
