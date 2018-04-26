const { Agent, Grid } = require('../index');

const grid = new Grid(10);

grid.agents.forEach(agent => {
    
    agent.value = 'o';
    if (Math.random() < 0.15) agent.value = 'x';

    agent.addRule(() => {

        const { x, y } = agent;
        
        let livingNeighbors = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                if (grid.getAgent(x + dx, y + dy).value === 'x') livingNeighbors++;
            }
        }

        agent.enqueue(() => {
            if (livingNeighbors < 2 || livingNeighbors > 3) {
                agent.value = 'o';
            } else if (livingNeighbors === 3) {
                agent.value = 'x';
            }
        });
    });
});

grid.log();

setInterval(() => {
    grid.tick();
    grid.log();
}, 1000);