const { Agent, GridEnvironment, utils } = require('../index');

const grid = new GridEnvironment(10);

grid.getAgents().forEach(agent => {
    
    agent.set('value', 'o');
    if (Math.random() < 0.15) agent.set('value', 'x');

    agent.addRule(() => {

        const { x, y } = agent;
        
        let livingNeighbors = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                if (grid.getAgent(x + dx, y + dy).get('value') === 'x') livingNeighbors++;
            }
        }

        agent.enqueue(() => {
            if (livingNeighbors < 2 || livingNeighbors > 3) {
                agent.set('value', 'o');
            } else if (livingNeighbors === 3) {
                agent.set('value', 'x');
            }
        });
    });
});

grid.log();

grid.tick(20);

grid.log();