import { Agent } from "../agents/Agent";
import { BBox } from "./BBox";
import median from "../utils/median";
import sample from "../utils/sample";
import { Vector } from "./Vector";
import distance from "../utils/distance";

const MAX_IN_LEAF = 5;

const getCoord = (i: number): "x" | "y" | "z" => {
  return i === 0 ? "x" : i === 1 ? "y" : "z";
};

const arrayOfTreesToAgents = (trees: KDTree[]): Agent[] => {
  if (trees.length === 0) return [];
  return trees
    .map(tree => tree.agents)
    .reduce((acc, agents) => acc.concat(agents));
};

/**
 * @since 0.3.5
 */
class KDTree {
  agents: Agent[] = null;
  bbox: BBox;
  depth: number = 0;
  dimension: number = 2;
  median: number = null;
  needsUpdating: boolean = false;
  parent: KDTree = null;
  left: KDTree = null;
  right: KDTree = null;

  constructor(
    agents: Agent[],
    dimension: number = 2,
    depth: number = 0,
    bbox?: BBox
  ) {
    this.depth = depth;
    this.dimension = dimension;
    this.bbox = bbox;

    // if not given a bounding box, instantiate to a 0-dimensional bbox
    // and update
    if (!this.bbox) {
      this.bbox = new BBox(
        new Vector(...new Array(this.dimension).fill(0)),
        new Vector(...new Array(this.dimension).fill(0))
      );
      this.needsUpdating = true;
    }

    this.rebalance(agents);
  }

  axis(): "x" | "y" | "z" | null {
    const { depth, dimension } = this;
    const axis =
      depth % dimension === 0
        ? "x"
        : depth % dimension === 1
        ? "y"
        : depth % dimension === 2
        ? "z"
        : null;

    return axis;
  }

  locateSubtree(pt: Agent | Point): KDTree {
    // create a position vector to correspond to the
    // given point or agent
    const position = new Vector();
    for (let i = 0; i < this.dimension; i++) {
      const coord = getCoord(i);
      const v = pt instanceof Agent ? pt.get(coord) : pt[coord];
      if (v < this.bbox.min[coord] || v > this.bbox.max[coord]) {
        throw new Error("Can't locate subtree out of bounds!");
      }
      position.set(i, v);
    }

    if (this.left && position[this.axis()] < this.median) {
      return this.left.locateSubtree(pt);
    } else if (this.right && position[this.axis()] >= this.median) {
      return this.right.locateSubtree(pt);
    }

    return this;
  }

  subtreesWithinDistance(
    pt: Point | Agent,
    d: number,
    trees: KDTree[] = []
  ): KDTree[] {
    const { left, right } = this;
    if (!left && !right) {
      if (this.sphereIntersectsBBox(pt, d)) trees.push(this);
    } else {
      if (left && left.sphereIntersectsBBox(pt, d))
        left.subtreesWithinDistance(pt, d, trees);
      if (right && right.sphereIntersectsBBox(pt, d))
        right.subtreesWithinDistance(pt, d, trees);
    }
    return trees;
  }

  intersectsAlongDimension = (
    pt: Point | Agent,
    d: number,
    coord: "x" | "y" | "z"
  ): boolean => {
    const c = pt instanceof Agent ? pt.get(coord) : pt[coord];
    const mn = this.bbox.min[coord];
    const mx = this.bbox.max[coord];
    if (c <= mn && c + d >= mn) return true;
    if (c >= mx && c - d <= mx) return true;
    if (c + d >= mn && c - d <= mx) return true;
    if (pt instanceof Agent && pt.environment.opts.torus) {
      const { environment } = pt;
      if (coord === "x" && c + d > environment.width) return true;
      if (coord === "x" && c - d < 0) return true;
      if (coord === "y" && c + d > environment.height) return true;
      if (coord === "y" && c - d < 0) return true;
    }
    return false;
  };

  sphereIntersectsBBox = (pt: Point | Agent, d: number): boolean => {
    // needs to be true for every dimension
    switch (this.dimension) {
      case 1:
        return this.intersectsAlongDimension(pt, d, "x");
      case 2:
        return (
          this.intersectsAlongDimension(pt, d, "x") &&
          this.intersectsAlongDimension(pt, d, "y")
        );
      case 3:
        return (
          this.intersectsAlongDimension(pt, d, "x") &&
          this.intersectsAlongDimension(pt, d, "y") &&
          this.intersectsAlongDimension(pt, d, "z")
        );
      default:
        return false;
    }
  };

  /**
   * Return all the Agents in this KDTree that are within `d` distance
   * of the given Point or Agent `pt`, optionally restricted to agents that
   * pass `filterFn`.
   * @param {Point | Agent} pt
   * @param {number} d
   * @param {(a: Agent) => boolean} [filterFn] - Optional predicate; only
   *   matching agents are returned. Defaults to accepting all agents.
   * @since 0.3.5
   */
  agentsWithinDistance(
    pt: Point | Agent,
    d: number,
    filterFn: (a: Agent) => boolean = () => true
  ): Agent[] {
    const trees = this.subtreesWithinDistance(pt, d);
    return arrayOfTreesToAgents(trees).filter(
      a => a !== pt && distance(a, pt) <= d && filterFn(a)
    );
  }

  /**
   * Returns the Agent in this KDTree that is closest spatially to the given
   * Point or Agent `pt`, optionally restricted to agents that pass `filterFn`.
   *
   * When `pt` is an Agent, its cached `__subtree` reference is used directly
   * instead of traversing from the root, avoiding an O(log n) traversal and a
   * potential out-of-bounds error. The search expands outward until a
   * qualifying candidate is found, then widens to all subtrees within that
   * distance to guarantee the true nearest filtered neighbor is returned.
   * Distance values are computed once per candidate and cached to avoid
   * redundant calculations during sorting.
   *
   * @param {Agent | Point} pt - The reference point or agent to search from.
   * @param {(a: Agent) => boolean} [filterFn] - Optional predicate. Only agents
   *   for which `filterFn(agent)` returns `true` are considered. Defaults to
   *   accepting all agents.
   * @returns {Agent} The nearest qualifying agent.
   * @since 0.3.5
   */
  nearestNeighbor(pt: Agent | Point, filterFn: (a: Agent) => boolean = () => true): Agent | null {
    // When pt is an Agent, use its cached subtree reference directly to avoid
    // an O(log n) root traversal and a potential out-of-bounds throw.
    const leafSubtree =
      pt instanceof Agent && pt.__subtree ? pt.__subtree : this.locateSubtree(pt);

    // Collect filtered candidates from the leaf and compute distances once.
    let candidates: Agent[] = leafSubtree.agents.filter(a => a !== pt && filterFn(a));
    let nearestDistance = candidates.reduce(
      (best, a) => Math.min(best, distance(a, pt)),
      Infinity
    );
    let trees: KDTree[];

    // If no qualifying candidates exist in the leaf, expand the search radius
    // outward exponentially until we find at least one filtered agent.
    // To avoid an infinite loop when NO agent passes the filter, we cap the
    // search at the diagonal of the bounding box (guarantees we've checked
    // everywhere) and return null if still nothing is found.
    const maxSearchDistance = Math.sqrt(
      Math.pow(this.bbox.max.x - this.bbox.min.x, 2) +
        Math.pow(this.bbox.max.y - this.bbox.min.y, 2) +
        (this.dimension === 3
          ? Math.pow(this.bbox.max.z - this.bbox.min.z, 2)
          : 0)
    );
    let testDistance = 0.001;
    while (nearestDistance === Infinity && testDistance <= maxSearchDistance * 2) {
      trees = this.subtreesWithinDistance(pt, testDistance);
      candidates = arrayOfTreesToAgents(trees).filter(a => a !== pt && filterFn(a));
      nearestDistance = candidates.reduce(
        (best, a) => Math.min(best, distance(a, pt)),
        Infinity
      );
      testDistance *= 3;
    }

    // If we've searched the entire tree and found nothing, return null.
    if (nearestDistance === Infinity) {
      return null;
    }

    // Collect all candidates within `nearestDistance`, compute each distance
    // once, sort by it, and return the closest.
    trees = this.subtreesWithinDistance(pt, nearestDistance);
    candidates = arrayOfTreesToAgents(trees).filter(a => a !== pt && filterFn(a));

    const withDist = candidates.map(a => ({ a, d: distance(a, pt) }));
    withDist.sort((x, y) => x.d - y.d);
    return withDist[0]?.a ?? null;
  }

  /**
   * Rebalance the KDTree (if it has been marked as needing updating).
   * Optionally pass the agents that belong to this tree (relevant for trees
   * of higher depth than the top level).
   * @param {Agent[]} agents
   * @since 0.3.5
   */
  rebalance(agents: Agent[] = this.agents): void {
    // only rebalance if the tree has been marked as needing updating.
    // otherwise, recursively rebalance left and right subtrees
    if (!this.needsUpdating) {
      if (this.left) this.left.rebalance();
      if (this.right) this.right.rebalance();
      return;
    }

    // if not given a set of agents against which to rebalance,
    // use the agents that are currently tracked in this tree
    if (agents) {
      this.agents = Array.from(agents);
    } else {
      agents = this.agents;
    }

    if (!agents || agents.length <= MAX_IN_LEAF) return;

    const axis = this.axis();
    if (axis === null) {
      console.error("Can only construct 1, 2, or 3-dimensional KD trees");
    }

    this.median = median(
      new Array(Math.min(agents.length, 11))
        .fill(0)
        .map(() => sample(agents).get(axis))
    );
    if (this.median === null) return;

    const left = new KDTree([], this.dimension, this.depth + 1);
    const right = new KDTree([], this.dimension, this.depth + 1);

    agents.forEach(agent => {
      for (let i = 0; i < this.dimension; i++) {
        const coord = getCoord(i);
        if (agent.get(coord) < this.bbox.min[coord])
          this.bbox.min[coord] = agent.get(coord);
        if (agent.get(coord) > this.bbox.max[coord])
          this.bbox.max[coord] = agent.get(coord);
      }

      if (agent.get(axis) < this.median) {
        left.agents.push(agent);
        agent.__subtree = left;
      } else {
        right.agents.push(agent);
        agent.__subtree = right;
      }
    });

    this.needsUpdating = false;

    // if somehow either left or right has 0 agents in it, we might enter an
    // infinite loop, so in that case set the agents
    // to belong to this subtree and shortcut out
    if (left.agents.length === 0 || right.agents.length === 0) {
      agents.forEach(a => (a.__subtree = this));
      return;
    }

    if (left.agents.length > 0) {
      this.left = left;
      const leftBBox = this.bbox.clone();
      if (axis === "x") leftBBox.max.x = this.median;
      if (axis === "y") leftBBox.max.y = this.median;
      if (axis === "z") leftBBox.max.z = this.median;
      left.bbox = leftBBox;
      left.parent = this;
      left.rebalance();
    }

    if (right.agents.length > 0) {
      this.right = right;
      const rightBBox = this.bbox.clone();
      if (axis === "x") rightBBox.min.x = this.median;
      if (axis === "y") rightBBox.min.y = this.median;
      if (axis === "z") rightBBox.min.z = this.median;
      right.bbox = rightBBox;
      right.parent = this;
      right.rebalance();
    }
  }

  removeAgent(agent: Agent, rebalance = true): boolean {
    if (!this.agents.includes(agent)) return false;
    this.agents.splice(this.agents.indexOf(agent), 1);
    this.needsUpdating = true;
    if (rebalance) this.rebalance();
  }
}

export { KDTree };
