---
title: Game of Life
---

The [Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) shows how remarkable complexity and emergent patterns can result from simple rules.

From one tick of the game to the next, a live cell with fewer than two or more than three live neighbors dies. A live cell with two or three neighbors lives on, and a dead cell with exactly three live neighbors becomes a live cell.

<script src="{{ site.baseurl }}/assets/flocc.js"></script>

<pre id="container"></pre>

```js
/**
 * Get references to the HTML container to render our environment,
 * set its size (width and height),
 * and instantiate a new GridEnvironment of that size.
 */ 
var container = document.getElementById('container');
var width = 50;
var height = 20;
var grid = new flocc.GridEnvironment(width, height);

var renderer = new flocc.ASCIIRenderer(grid);
renderer.mount(container);

/**
 * Setup loops over all the cells, and randomly assigns them to be alive or dead
 * (15% chance of being alive -- change this and see what happens!)
 * 
 * Finally, it adds the `tick` rule, which is called with every tick of the simulation.
 */ 
function setup() {
    grid.getCells().forEach(cell => {
        cell.set('alive', Math.random() < 0.15);
        cell.addRule(tick);
    });
}

/**
 * With each tick of the simulation, figure out how many neighbors
 * the cell has, and which of those are living. 
 * Then enqueue the liveOrDie function, passing in the number
 * of living neighbors as an argument.
 */ 
function tick(cell) {

    var x = cell.get('x');
    var y = cell.get('y');

    var livingNeighbors = 0;
    for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            if (grid.getCell(x + dx, y + dy).get('alive')) livingNeighbors++;
        }
    }

    cell.enqueue(liveOrDie, livingNeighbors);
}

/**
 * After running the above `tick` function for each agent, the
 * environment runs any enqueued functions, including this `liveOrDie` function.
 * Look at the number of living neighbors -- if it is 2 or 3, the cell stays or becomes
 * alive. If it is under 2 or greater than 3, the cell dies (or stays dead).
 */ 
function liveOrDie(cell, livingNeighbors) {
    if (livingNeighbors < 2 || livingNeighbors > 3) {
        cell.set('alive', false);
    } else if (livingNeighbors === 3) {
        cell.set('alive', true);
    }
    
    // The ASCIIRenderer chooses what to display from the cell's value
    cell.set('value', cell.get('alive') ? 'X' : '.');
}

function render() {
    grid.tick();
    setTimeout(render, 200);
}

setup();
render();
```

<script>
var container = document.getElementById('container');
var width = 50;
var height = 20;
var grid = new flocc.GridEnvironment(width, height);

var renderer = new flocc.ASCIIRenderer(grid);
renderer.mount(container);

function setup() {

    grid.getCells().forEach(cell => {
        cell.set('alive', Math.random() < 0.15);
        cell.addRule(tick);
    });
}

function tick(agent) {

    var x = agent.get('x');
    var y = agent.get('y');

    var livingNeighbors = 0;
    for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            if (grid.getCell(x + dx, y + dy).get('alive')) livingNeighbors++;
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
function liveOrDie(cell, livingNeighbors) {
    if (livingNeighbors < 2 || livingNeighbors > 3) {
        cell.set('alive', false);
    } else if (livingNeighbors === 3) {
        cell.set('alive', true);
    }
    
    // The ASCIIRenderer chooses what to display from the cell's value
    cell.set('value', cell.get('alive') ? 'X' : '.');
}

function render() {
    grid.tick();
    setTimeout(render, 200);
}

setup();
render();
</script>