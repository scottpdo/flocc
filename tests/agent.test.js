const { Agent } = require('../flocc');

const agent = new Agent();
agent.set('x', 12);
agent.set('y', 23);

it('Correctly gets data associated with an agent.', () => {
  
  expect(agent.get('x')).toEqual(12);
  expect(agent.get('y')).toEqual(23);
  expect(agent.getData()).toEqual({ x: 12, y: 23 });

  expect(agent.get('z')).toBeNull();

  const { x } = agent.getData();
  expect(x).toBe(12);
});