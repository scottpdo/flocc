import { Agent } from "../agents/Agent";
import { BBox } from "./BBox";
import median from "../utils/median";
import sample from "../utils/sample";
import { Vector } from "./Vector";
import { utils } from "../utils/utils";
import distance from "../utils/distance";

const MAX_IN_LEAF = 5;

const getCoord = (i: number): "x" | "y" | "z" => {
  return i === 0 ? "x" : i === 1 ? "y" : "z";
};

const arrayOfTreesToAgents = (trees: KDTree[]): Agent[] => {
  return trees
    .map(tree => tree.agents)
    .reduce((acc, agents) => acc.concat(agents));
};

class KDTree {
  agents: Agent[];
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
    this.agents = agents;
    this.depth = depth;
    this.dimension = dimension;
    this.bbox = bbox;
    // if not given a bounding box, instantiate to a 0-dimensional bbox
    // and update
    if (!this.bbox) {
      this.bbox = new BBox(
        new Vector(...new Array(dimension).fill(0)),
        new Vector(...new Array(dimension).fill(0))
      );
      this.needsUpdating = true;
    }

    if (agents.length <= MAX_IN_LEAF) return;

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

    const left: Agent[] = [];
    const right: Agent[] = [];
    agents.forEach(agent => {
      if (this.needsUpdating) {
        for (let i = 0; i < this.dimension; i++) {
          const coord = getCoord(i);
          if (agent.get(coord) < this.bbox.min[coord])
            this.bbox.min[coord] = agent.get(coord);
          if (agent.get(coord) > this.bbox.max[coord])
            this.bbox.max[coord] = agent.get(coord);
        }
      }
      if (agent.get(axis) < this.median) {
        left.push(agent);
      } else {
        right.push(agent);
      }
    });

    this.needsUpdating = false;

    if (left.length > 0) {
      const leftBBox = this.bbox.clone();
      if (axis === "x") leftBBox.max.x = this.median;
      if (axis === "y") leftBBox.max.y = this.median;
      this.left = new KDTree(left, dimension, depth + 1, leftBBox);
      this.left.parent = this;
    }
    if (right.length > 0) {
      const rightBBox = this.bbox.clone();
      if (axis === "x") rightBBox.min.x = this.median;
      if (axis === "y") rightBBox.min.y = this.median;
      this.right = new KDTree(right, dimension, depth + 1, rightBBox);
      this.right.parent = this;
    }
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
    const { bbox, dimension, left, right } = this;
    const { min, max } = bbox;
    if (left) left.subtreesWithinDistance(pt, d, trees);
    if (right) right.subtreesWithinDistance(pt, d, trees);
    if (!left && !right) {
      const match = new Array(dimension)
        .fill(0)
        .map((a, i) => getCoord(i))
        .every(coord => {
          const c = pt instanceof Agent ? pt.get(coord) : pt[coord];
          const mn = min[coord];
          const mx = max[coord];
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
        });
      if (match) trees.push(this);
    }
    return trees;
  }

  agentsWithinDistance(pt: Point | Agent, d: number): Agent[] {
    const trees = this.subtreesWithinDistance(pt, d);
    return arrayOfTreesToAgents(trees).filter(
      a => a !== pt && distance(a, pt) <= d
    );
  }

  nearestNeighbor(pt: Agent | Point): Agent {
    // locate the subtree this point is in
    let candidates: Agent[] = this.locateSubtree(pt).agents.filter(
      a => a !== pt
    );

    // get the distance of the nearest candidate agent in this subtree
    let nearestDistance = utils.min(candidates.map(a => distance(a, pt)));
    let trees: KDTree[];

    // if there are no other candidates, then slowly expand the circle outward
    // from this agent until we hit at least one
    let testDistance = 0.001;
    while (nearestDistance === Infinity) {
      trees = this.subtreesWithinDistance(pt, testDistance);
      candidates = arrayOfTreesToAgents(trees).filter(a => a !== pt);
      nearestDistance = utils.min(candidates.map(a => distance(a, pt)));
      testDistance *= 3;
    }

    // get all subtrees that could contain agents
    // within `nearestDistance` radius
    trees = this.subtreesWithinDistance(pt, nearestDistance);
    candidates = arrayOfTreesToAgents(trees).filter(a => a !== pt);

    // sort by distance
    candidates.sort((a, b) => {
      return distance(a, pt) < distance(b, pt) ? -1 : 1;
    });

    return candidates[0];
  }
}

export { KDTree };
