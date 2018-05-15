---
title: Segregation
---

<script src="/assets/flocc.js"></script>
    
<pre id="container"></pre>
<button id="reset">Randomize</button>

<script>
var container = document.getElementById('container');
var width = 50;
var height = 20;
var grid = new flocc.GridEnvironment(width, height);

function setup() {

    grid.loop(function(x, y, agent) {

        grid.removeAgent(x, y);

        if (Math.random() < 0.05) return;
        
        var agent = grid.addAgent(x, y);
        agent.set('value', Math.random() > 0.5 ? 'X' : '.');
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

    if (percentLike < 0.5) move(agent, percentLike);
}

function move(agent, percentLike) {
    var space = grid.getRandomOpenCell();
    grid.swap(agent.get('x'), agent.get('y'), space.x, space.y);
}

function render() {

    container.innerHTML = '';
    grid.loop(function(x, y, agent) {
        container.innerHTML += agent ? agent.get('value') : ' ';
        if (x === width - 1) container.innerHTML += '\n';
    });

    grid.tick();

    setTimeout(render, 250);
}

setup();
render();

document.getElementById('reset').addEventListener('click', setup);
</script>