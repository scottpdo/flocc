---
title: Emergent Voronoi
---

A [Voronoi diagram](https://en.wikipedia.org/wiki/Voronoi_diagram) divides a plane into a set of non-overlapping regions, where each region is the set of points closest to a given point in that region.

One method of deriving a Voronoi diagram from a set of points on a plane is through the emergent movement of (many more) random vectors on the plane. In this example, 25 random points are placed on the plane to divide it into regions. Then, 1,000 random vectors (points with a random directional velocity) are placed and begin moving until they are the same distance from the two nearest points. Then, they stop. The resulting accumulation of stationary vectors describes the boundaries of the Voronoi diagram.

<script src="{{ site.baseurl }}/assets/flocc.js"></script>

<div id="container"></div>
<button id="reset">Reset</button>

<script>
const width = 600;
const height = 400;

const environment = new flocc.Environment();
const renderer = new flocc.CanvasRenderer(environment, { width, height });
renderer.mount('#container');

let pts;

function setup() {

    pts = [];
    while (environment.getAgents().length > 0) {
        environment.getAgents().pop();
    }

    while (pts.length < 25) {
        const pt = new flocc.Agent();
        pt.set('x', (Math.random() * width) | 0);
        pt.set('y', (Math.random() * height) | 0);
        pts.push(pt);
    }

    for (let i = 0; i < 1000; i++) {
        const agent = new flocc.Agent();

        agent.set('x', Math.random() * width);
        agent.set('y', Math.random() * height);
        agent.set('dir', Math.random() * 2 * Math.PI);
        agent.set('radius', Math.abs(flocc.utils.gaussian(2, 1)) + 0.75);  
        agent.addRule(tick);
        environment.addAgent(agent);
    }
}

function tick(agent) {
    
    let pt1 = null, pt2 = null;
    let d1 = Infinity, d2 = Infinity;

    const closest = [];
    
    pts.forEach(pt => {
        const d = flocc.utils.distance(agent, pt);
        // const d = Math.abs(agent.get('x') - pt.get('x')) + Math.abs(agent.get('y') - pt.get('y'));
        if (d < d1) {
            if (pt1 !== null) {
                pt2 = pt1;
                d2 = d1;
            }
            pt1 = pt;
            d1 = d;
        }
    });

    if (Math.abs(d1 - d2) < 1.5) return;
        
    agent.set('x', agent.get('x') + 0.7 * Math.cos(agent.get('dir')));
    agent.set('y', agent.get('y') + 0.7 * Math.sin(agent.get('dir')));
}

function render() {

    environment.tick();

    // setTimeout(render, 200);
    window.requestAnimationFrame(render);
}

setup();
render();

document.getElementById('reset').addEventListener('click', setup);
</script>