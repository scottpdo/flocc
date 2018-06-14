---
title: Flocking
---

<script src="{{ site.baseurl }}/assets/flocc.js"></script>

<canvas id="container"></canvas>
<button id="reset">Randomize</button>

<script>
var container = document.getElementById('container');
var flockSize = 250;
var space = new flocc.Environment();

var width = 600;
var height = 400;

function setup() {

    space.agents = [];

    for (var i = 0; i < flockSize; i++) {
        
        var agent = new flocc.Agent();
        
        agent.set('x', Math.random() * width);
        agent.set('y', Math.random() * height);

        const angle = 2 * Math.random() * Math.PI;
        agent.set('velocity', {
            x: Math.cos(angle),
            y: Math.sin(angle)
        });

        agent.addRule(tick);

        space.addAgent(agent);
    }
}

function tick(agent) {

    var x = agent.get('x');
    var y = agent.get('y');
    
    x += agent.get('velocity').x;
    y += agent.get('velocity').y;

    while (x < 0) x += width;
    while (x >= width) x -= width;
    while (y < 0) y += height;
    while (y >= height) y -= height;

    agent.set('x', x);
    agent.set('y', y);

    // update direction
    var neighbors = space.getAgents().filter(function(neighbor) {
        var d = flocc.utils.distance(agent, neighbor);
        return d < 20 && d > 0;
    });

    if (neighbors.length === 0) return;

    var meanVel = neighbors.reduce(function(a, b) {
        return {
            x: (a.x + b.get('velocity').x),
            y: (a.y + b.get('velocity').y)
        };
    }, { x: 0, y: 0 });

    const norm = flocc.utils.distance(meanVel, { x: 0, y: 0 });
    meanVel.x /= norm;
    meanVel.y /= norm;
    
    agent.set('velocity', {
        x: (99 * agent.get('velocity').x + meanVel.x) / 100,
        y: (99 * agent.get('velocity').y + meanVel.y) / 100
    });
}

function render() {
    
    container.width = width;
    container.height = height;

    var context = container.getContext('2d');

    context.clearRect(0, 0, width, height);

    space.getAgents().forEach(function(agent, i) {
        context.beginPath();
        context.arc(agent.get('x'), agent.get('y'), 3, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
    });

    space.tick();

    requestAnimationFrame(render);
}

setup();
render();

document.getElementById('reset').addEventListener('click', setup);
</script>