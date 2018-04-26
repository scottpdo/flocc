const { Agent, Environment, GridEnvironment } = require('../index');

const grid = new GridEnvironment(10);
grid.tick();