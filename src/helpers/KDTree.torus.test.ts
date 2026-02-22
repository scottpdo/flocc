/**
 * KDTree — Torus (wraparound) tests
 *
 * Verifies that spatial queries correctly use shortest-path distances on a
 * toroidal environment. The key risk: when the tree splits (> MAX_IN_LEAF=5
 * agents), agents near the far edge land in a different subtree, and the
 * torus check in intersectsAlongDimension must bridge the wrap.
 */

import { Agent, Environment, KDTree } from '../main';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Add an agent at (x, y) to env; return it. */
function addAt(env: Environment, x: number, y: number): Agent {
  const a = new Agent({ x, y });
  env.addAgent(a, false); // rebalance: false — rebalance once at end
  return a;
}

/** Euclidean torus distance between two (x,y) tuples. */
function torusDist(ax: number, ay: number, bx: number, by: number, w: number, h: number): number {
  let dx = Math.abs(bx - ax);
  let dy = Math.abs(by - ay);
  if (dx > w / 2) dx = w - dx;
  if (dy > h / 2) dy = h - dy;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─── setup ────────────────────────────────────────────────────────────────────

// 100×100 torus. We populate it with enough "filler" agents to force tree
// splits (MAX_IN_LEAF = 5), so the torus paths through the bbox checks are
// exercised.
const W = 100;
const H = 100;

// ─── Test 1: nearestNeighbor across the wrap ──────────────────────────────────

it("nearestNeighbor returns the toroidally nearest agent, not just the Euclidean nearest", () => {
  const env = new Environment({ torus: true, width: W, height: H });
  const tree = new KDTree([], 2);
  env.use(tree);

  // Filler agents spread across the middle to force tree splits
  for (let x = 30; x <= 70; x += 10) {
    for (let y = 30; y <= 70; y += 10) {
      addAt(env, x, y);
    }
  }

  const a = addAt(env, 1, 1);   // query agent
  const b = addAt(env, 5, 5);   // Euclidean nearest — dist ≈ 5.66
  const c = addAt(env, 99, 99); // Torus nearest   — dist ≈ 2.83

  tree.rebalance();

  const nearest = tree.nearestNeighbor(a);

  // Confirm our expected distances
  expect(torusDist(1, 1, 5, 5, W, H)).toBeCloseTo(5.66, 1);
  expect(torusDist(1, 1, 99, 99, W, H)).toBeCloseTo(2.83, 1);

  expect(nearest).toBe(c);
});

// ─── Test 2: nearestNeighbor — wrap on x-axis only ───────────────────────────

it("nearestNeighbor handles wrapping on a single axis", () => {
  const env = new Environment({ torus: true, width: W, height: H });
  const tree = new KDTree([], 2);
  env.use(tree);

  for (let x = 30; x <= 70; x += 10) {
    for (let y = 45; y <= 55; y += 5) {
      addAt(env, x, y);
    }
  }

  const a = addAt(env, 2, 50);  // query agent
  const b = addAt(env, 6, 50);  // Euclidean nearest — dist = 4
  const c = addAt(env, 98, 50); // Torus nearest    — dist = 4... wait, equal!
  // Make c clearly closer by putting it at 99
  const d = addAt(env, 99, 50); // Torus dist = min(99-2, 100-(99-2)) = min(97,3) = 3

  tree.rebalance();

  const nearest = tree.nearestNeighbor(a);

  expect(torusDist(2, 50, 6, 50, W, H)).toBeCloseTo(4, 5);
  expect(torusDist(2, 50, 99, 50, W, H)).toBeCloseTo(3, 5);

  expect(nearest).toBe(d);
});

// ─── Test 3: agentsWithinDistance spans the wrap ─────────────────────────────

it("agentsWithinDistance includes toroidally close agents across the boundary", () => {
  const env = new Environment({ torus: true, width: W, height: H });
  const tree = new KDTree([], 2);
  env.use(tree);

  for (let x = 30; x <= 70; x += 10) {
    for (let y = 30; y <= 70; y += 10) {
      addAt(env, x, y);
    }
  }

  const a  = addAt(env, 2, 2);
  const b  = addAt(env, 6, 6);   // dist ≈ 5.66 — outside radius 5
  const c  = addAt(env, 98, 98); // torus dist ≈ 5.66 — outside radius 5
  const d  = addAt(env, 99, 99); // torus dist ≈ 2.83 — inside radius 5

  tree.rebalance();

  const neighbors = tree.agentsWithinDistance(a, 5);

  expect(neighbors).not.toContain(a); // self never included
  expect(neighbors).not.toContain(b); // Euclidean dist ~5.66 > 5
  expect(neighbors).not.toContain(c); // torus dist ~5.66 > 5
  expect(neighbors).toContain(d);     // torus dist ~2.83 ≤ 5
});

// ─── Test 4: agentsWithinDistance — both sides of the wrap ────────────────────

it("agentsWithinDistance captures agents near both the left and right edges", () => {
  const env = new Environment({ torus: true, width: W, height: H });
  const tree = new KDTree([], 2);
  env.use(tree);

  for (let x = 30; x <= 70; x += 10) {
    for (let y = 30; y <= 70; y += 10) {
      addAt(env, x, y);
    }
  }

  // A sits right on the left edge
  const a    = addAt(env, 0, 50);
  const near = addAt(env, 3, 50);  // dist = 3 — inside radius 5
  const far  = addAt(env, 8, 50);  // dist = 8 — outside radius 5
  const wrap = addAt(env, 97, 50); // torus dist = 3 — inside radius 5

  tree.rebalance();

  const neighbors = tree.agentsWithinDistance(a, 5);

  expect(neighbors).toContain(near);
  expect(neighbors).not.toContain(far);
  expect(neighbors).toContain(wrap);
});

// ─── Test 5: nearestNeighbor returns null when filter matches nothing ────────

it("nearestNeighbor returns null (not infinite loop) when no agent passes filter", () => {
  const env = new Environment({ torus: true, width: W, height: H });
  const tree = new KDTree([], 2);
  env.use(tree);

  // Add some agents of type "predator"
  for (let i = 0; i < 10; i++) {
    const a = new Agent({ x: Math.random() * W, y: Math.random() * H });
    a.set('typeId', 'predator');
    env.addAgent(a, false);
  }

  const query = new Agent({ x: 50, y: 50 });
  query.set('typeId', 'predator');
  env.addAgent(query, false);

  tree.rebalance();

  // Filter for "prey" — but there are none
  const nearest = tree.nearestNeighbor(query, a => a.get('typeId') === 'prey');

  // Should return null, NOT hang in infinite loop
  expect(nearest).toBeNull();
});

// ─── Test 6: correct after rebalance ─────────────────────────────────────────

it("torus nearest neighbor remains correct after rebalancing", () => {
  const env = new Environment({ torus: true, width: W, height: H });
  const tree = new KDTree([], 2);
  env.use(tree);

  for (let x = 30; x <= 70; x += 10) {
    for (let y = 30; y <= 70; y += 10) {
      addAt(env, x, y);
    }
  }

  const a = addAt(env, 1, 50);
  const b = addAt(env, 4, 50);   // dist = 3
  const c = addAt(env, 98, 50);  // torus dist = 3 (tie — either is valid)
  const d = addAt(env, 97, 50);  // torus dist = 4

  tree.rebalance();

  // Remove b — now c (torus dist 3) should be nearest
  env.removeAgent(b);

  const nearest = tree.nearestNeighbor(a);
  expect(torusDist(1, 50, 97, 50, W, H)).toBeCloseTo(4, 5);
  expect(torusDist(1, 50, 98, 50, W, H)).toBeCloseTo(3, 5);
  expect(nearest).toBe(c);
});
