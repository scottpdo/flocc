---
title: Game of Life
---

<script src="/assets/flocc.js"></script>

<pre id="container"></pre>
<button id="reset">Randomize</button>

<script>
/**
 * Get references to the HTML container to render our environment,
 * set its size (width and height),
 * and instantiate a new GridEnvironment of that size.
 */ 
var container = document.getElementById('container');
var width = 50;
var height = 20;
var grid = new flocc.GridEnvironment(width, height);

/**
 * Setup fills every cell of the GridEnvironment with a new Agent
 * (if called more than once, this overwrites all the old agents in the grid).
 * 
 * Then it loops over all the agents, and randomly assigns them to be alive or dead
 * (15% chance of being alive -- change this and see what happens!)
 * 
 * Finally, it adds the `tick` rule, which is called with every tick of the simulation.
 */ 
function setup() {

    grid.fill();

    grid.loop(function(x, y, agent) {
        agent.set('alive', Math.random() < 0.15);
        agent.addRule(tick);
    });
}

/**
 * With each tick of the simulation, figure out how many neighbors
 * the agent has, and which of those are living. 
 * Then enqueue the liveOrDie function, passing in the number
 * of living neighbors as an argument.
 */ 
function tick(agent) {

    var x = agent.get('x');
    var y = agent.get('y');

    var livingNeighbors = 0;
    for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            if (grid.getAgent(x + dx, y + dy).get('alive')) livingNeighbors++;
        }
    }

    agent.enqueue(liveOrDie, livingNeighbors);
}

/**
 * After running the above `tick` function for each agent, the
 * environment runs any enqueued functions, including this `liveOrDie` function.
 * Look at the number of living neighbors -- if it is 2 or 3, the agent stays or becomes
 * alive. If it is under 2 or greater than 3, the agent dies (or stays dead).
 */ 
function liveOrDie(agent, livingNeighbors) {
    if (livingNeighbors < 2 || livingNeighbors > 3) {
        agent.set('alive', false);
    } else if (livingNeighbors === 3) {
        agent.set('alive', true);
    }
}

function render() {

    container.innerHTML = '';
    grid.loop(function(x, y, agent) {
        container.innerHTML += agent.get('alive') ? 'x' : '-';
        if (x === width - 1) container.innerHTML += '\n';
    });

    grid.tick();

    setTimeout(render, 200);
}

setup();
render();

document.getElementById('reset').addEventListener('click', setup);
</script>