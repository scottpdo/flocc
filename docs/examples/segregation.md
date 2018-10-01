---
title: Segregation
---

The Schelling Segregation model (1971) demonstrates how group-level patterns can emerge that are disconnected from the intentions of individuals. In this model, agents have a value of either `.` or `X`. An agent belonging to each group wants to be surrounded by more of its own type than the other, and will move to an empty cell in the environment if it is in the minority.

These agents do not exhibit aversion to other types of agents _per se_, and only want to find a position in a non-minority group, but the resulting movements deterministically result in a _highly segregated_ environment.

<script src="{{ site.baseurl }}/assets/flocc.js"></script>
    
<pre id="container"></pre>
<button id="reset">Randomize</button>

<script>
var container = document.getElementById('container');
var width = 50;
var height = 20;

var grid = new flocc.GridEnvironment(width, height);
var renderer = new flocc.ASCIIRenderer(grid);
renderer.mount(container);

function setup() {

    grid.getCells().forEach(function(cell) {

        const x = cell.get('x');
        const y = cell.get('y');
        grid.removeAgent(x, y);

        if (Math.random() < 0.05) return;
        
        var agent = grid.addAgent(x, y);
        var r = Math.random();
        agent.set('value', r > 0.5 ? 'X' : '.');

        agent.addRule(tick);
    });
}

function tick(agent) {

    var x = agent.get('x');
    var y = agent.get('y');
    var value = agent.get('value');

    var percentLike = 0;
    var neighbors = 0;

    for (var dx = -1; dx <= 1; dx++) {

        for (var dy = -1; dy <= 1; dy++) {
            
            if (dx === 0 && dy === 0) continue;
            
            var maybeNeighbor = grid.getAgent(x + dx, y + dy);
            if (!maybeNeighbor) continue;

            neighbors++;
            if (maybeNeighbor.get('value') === value) percentLike++;
        }
    }
    
    if (neighbors === 0) return;

    percentLike /= neighbors;

    if (percentLike < 0.5) move(agent);
}

function move(agent) {
    var space = grid.getRandomOpenCell();
    grid.swap(agent.get('x'), agent.get('y'), space.get('x'), space.get('y'));
}

function render() {

    grid.tick();

    setTimeout(render, 250);
}

setup();
render();

document.getElementById('reset').addEventListener('click', setup);
</script>