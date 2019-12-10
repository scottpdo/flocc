import { Agent } from "../agents/Agent";
import median from "../utils/median";
import sample from "../utils/sample";

class KDTree {
  agents: Agent[];
  depth: number = 0;
  dimension: number = 2;
  median: number = null;
  left: KDTree = null;
  right: KDTree = null;

  constructor(agents: Agent[], dimension: number = 2, depth: number = 0) {
    this.agents = agents;
    this.depth = depth;
    this.dimension = dimension;

    if (agents.length < 5) return;

    const axis = this.axis();
    if (axis === null) {
      console.error("Can only construct 1, 2, or 3-dimensional KD trees");
    }

    this.median = median(
      new Array(Math.min(agents.length, 99))
        .fill(0)
        .map(() => sample(agents).get(axis))
    );
    if (this.median === null) return;

    const left: Agent[] = [];
    const right: Agent[] = [];
    agents.forEach(agent => {
      if (agent.get(axis) < this.median) {
        left.push(agent);
      } else {
        right.push(agent);
      }
    });

    if (left.length > 0) this.left = new KDTree(left, dimension, depth + 1);
    if (right.length > 0) this.right = new KDTree(right, dimension, depth + 1);
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

  nearestNeighbors(pt: Agent | Point) {
    const { x, y, z } = pt instanceof Agent ? pt.getData() : pt;
  }
}

export { KDTree };
