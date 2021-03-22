/// <reference path="../environments/EnvironmentHelper.d.ts" />
import { Agent } from "../agents/Agent";
import { Environment } from "../environments/Environment";
import mean from "../utils/mean";
import shuffle from "../utils/shuffle";
import { Array2D } from "./Array2D";

/**
 * A `Network` allows {@linkcode Agent}s to be connected to each other.
 * @since 0.1.3
 */
class Network implements EnvironmentHelper {
  /** @hidden */
  adjacencyList: Map<Agent, Agent[]> = new Map();
  /**
   * instantiated and updated in _resetAdjacencyMatrix
   * @hidden
   */
  adjacencyMatrix: Array2D = null;

  /**
   * An array of the {@linkcode Agent}s in this `Network`
   * (in the order they were added).
   */
  agents: Agent[] = [];

  /**
   * Add an agent to the network.
   * @returns Returns `true` if the `Agent` was successfully added, `false` otherwise.
   *
   * ```js
   * const a = new Agent();
   * network.addAgent(a); // returns true
   * network.addAgent(a); // returns false since `a` was already in the `Network`
   * ```
   * @since 0.1.3
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
   * Given an {@linkcode Environment}, add all the {@linkcode Agent}s in that `Environment`
   * to this `Network`. (This is a shortcut for calling `environment.getAgents().forEach(a => network.addAgent(a)));`)
   * @since 0.2.1
   */
  addFromEnvironment(environment: Environment): void {
    environment.getAgents().forEach(agent => this.addAgent(agent));
  }

  /**
   * Removes an {@linkcode Agent} from the `Network`.
   *
   * ```js
   * const a = new Agent();
   * network.addAgent(a);
   *
   * network.removeAgent(a); // returns true
   *
   * network.removeAgent(a); // returns false since `a` was no longer in the `Network`
   * ```
   *
   * @returns Returns `true` if the agent was successfully removed.
   *
   * Returns `false` if the agent was not in the network to begin with.
   * @since 0.1.3
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
   * Removes all {@linkcode Agent}s from the `Network`.
   *
   * ```js
   * const network = new Network();
   * network.addAgent(new Agent());
   * network.size(); // returns 1
   *
   * network.clear();
   * network.size(); // returns 0
   * ```
   *
   * @since 0.2.1
   */
  clear(): void {
    while (this.agents.length > 0) {
      const a0 = this.agents[0];
      this.removeAgent(a0);
    }
  }

  /**
   * Attempts to create a connection between {@linkcode Agent}s `a` and `b`.
   * @returns Returns `true` if the connection was successfully created (i.e. if `a` and `b` were previously not connected and now are).
   *
   * ```js
   * const a = new Agent();
   * const b = new Agent();
   * network.addAgent(a);
   * network.addAgent(b);
   *
   * network.connect(a, b); // returns true
   *
   * network.connect(a, b); // returns false since they are now already connected
   *
   * const c = new Agent();
   * network.connect(a, c); // returns false since `c` is not in the `Network`
   * ```
   *
   * Returns `false` otherwise, for example if `a` and `b` are the same `Agent`, or if either is not in the `Network`.
   * @since 0.1.3
   */
  connect(a: Agent, b: Agent): boolean {
    if (a === b) return false;
    if (!this.isInNetwork(a) || !this.isInNetwork(b)) return false;

    if (!this.areConnected(a, b)) {
      this.adjacencyList.get(a).push(b);
      this.adjacencyList.get(b).push(a);

      const i1 = this.indexOf(a);
      const i2 = this.indexOf(b);
      this.adjacencyMatrix.set(i1, i2, 1);
      this.adjacencyMatrix.set(i2, i1, 1);
      return true;
    }

    return false;
  }

  /**
   * @returns Returns `true` if {@linkcode Agent}s `a` and `b` are connected, `false` if they are not.
   *
   * ```js
   * network.connect(a, b);
   * network.areConnected(a, b); // returns true since they have been connected
   *
   * network.disconnect(a, b);
   * network.areConnected(a, b); // returns false since they have been disconnected
   * ```
   *
   * @since 0.1.3
   */
  areConnected(a: Agent, b: Agent): boolean {
    if (!this.isInNetwork(a) || !this.isInNetwork(b)) return false;
    const i1 = this.indexOf(a);
    const i2 = this.indexOf(b);
    return (
      this.adjacencyMatrix.get(i1, i2) === 1 &&
      this.adjacencyMatrix.get(i2, i1) === 1
    );
  }

  /**
   * Attempts to sever the connection between {@linkcode Agent}s `a` and `b`.
   * @returns Returns `true` if the `Agent`s were successfully disconnected, `false` otherwise.
   *
   * ```js
   * const a = new Agent();
   * const b = new Agent();
   * network.addAgent(a);
   * network.addAgent(b);
   *
   * network.connect(a, b);
   * network.disconnect(a, b); // returns true since they were connected and are no longer
   *
   * network.disconnect(a, b); // returns false since they were already not connected
   * ```
   *
   * @since 0.1.3
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
   * @returns Returns the number of {@linkcode Agent}s in the `Network`.
   *
   * ```js
   * const a = new Agent();
   * const b = new Agent();
   * const c = new Agent();
   * [a, b, c].forEach(agt => network.addAgent(agt));
   *
   * network.size(); // returns 3
   * ```
   *
   * @since 0.1.3
   */
  size(): number {
    return this.agents.length;
  }

  /**
   * Loop over all the {@linkcode Agent}s in the `Network` (in the order they were added),
   * and invoke the `callback` function with the `Agent` and an index passed as parameters.
   * @since 0.1.3
   */
  forEach(callback: (agent: Agent, index: number) => any) {
    this.agents.forEach(callback);
  }

  /**
   * The same method as {@linkcode forEach}, but executes in random order.
   * @since 0.1.3
   */
  forEachRand(callback: (agent: Agent, index: number) => any) {
    shuffle(this.agents).forEach(callback);
  }

  /**
   * Returns `true` if the given {@linkcode Agent} is in the `Network`, `false` if it is not.
   * @since 0.1.3
   */
  isInNetwork(agent: Agent): boolean {
    return this.adjacencyList.has(agent);
  }

  /**
   * Returns the {@linkcode Agent} at index `i`, where `i = 0` is the first `Agent`
   * added to the `Network`, `i = 1` the second, etc.
   *
   * Negative indices are allowed, so `network.get(-1)` returns the `Agent` that was most recently
   * added to the `Network`, `-2` the second-most recent, etc.
   * @since 0.1.3
   */
  get(i: number): Agent {
    while (i < 0) i += this.size();
    while (i >= this.size()) i -= this.size();
    return this.agents[i];
  }

  /**
   * Returns the index of the given {@linkcode Agent} in the {@linkcode agents} array.
   * @since 0.1.3
   */
  indexOf(agent: Agent): number {
    return this.agents.indexOf(agent);
  }

  /**
   * Returns an array of {@linkcode Agent}s that are connected to the given `Agent` (in no guaranteed order).
   *
   * Returns `null` if the given `Agent` is not in the `Network`.
   *
   * ```js
   * // suppose a, b, and c are connected
   * network.neighbors(a); // returns [b, c] (or [c, b])
   *
   * network.disconnect(a, c);
   * network.neighbors(a); // returns [b]
   * network.neighbors(c); // returns [b]
   * ```
   *
   * @since 0.1.3
   */
  neighbors(agent: Agent): Agent[] | null {
    if (!this.isInNetwork(agent)) return null;
    return this.adjacencyList.get(agent);
  }

  /**
   * Draw a connection between every pair of {@linkcode Agent}s in the `Network`.
   * @since 0.1.3
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
   * @hidden
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
   * Returns `true` if `Agent`s a, b, and c form a 'triplet' &mdash; if (at least) one of the three is connected to the other two. Returns `false` otherwise.
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
   * Returns `true` if `Agent`s a, b, and c form a 'closed triplet' &mdash; if each of the three are connected to the other two. Returns `false` otherwise.
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

  /** @hidden */
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
   * The {@link https://en.wikipedia.org/wiki/Clustering_coefficient | clustering coefficient} is a measure of how
   * closely connected either an individual {@linkcode Agent}'s connections are or the `Network` as a whole is.
   *
   * If an `Agent` is passed as the single parameter, returns the {@link https://en.wikipedia.org/wiki/Clustering_coefficient#Local_clustering_coefficient | local
   * clustering coefficient} for that `Agent`.
   *
   * If no parameter is passed, returns the {@link https://en.wikipedia.org/wiki/Clustering_coefficient#Global_clustering_coefficient | global clustering coefficient}
   * of the `Network` (an aggregate measure of how connected the `Agent`s are).
   *
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
   * Returns the {@link https://en.wikipedia.org/wiki/Clustering_coefficient#Network_average_clustering_coefficient | average clustering coefficient} for the `Network` (the average
   * of the {@link Network.clusteringCoefficient | local clustering coefficient} across all `Agent`s).
   *
   * Note that this is a different measurement from the _global_ clustering coefficient
   * (i.e. calling {@linkcode clusteringCoefficient} without any parameters).
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
