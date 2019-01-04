const { Agent } = require('../dist/flocc');

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

it('Correctly sets new data.', () => {

  agent.set('x', 65);
  expect(agent.get('x')).toEqual(65);

  agent.set({
    x: 100,
    y: false
  });

  expect(agent.get('x')).toEqual(100);
  expect(agent.get('y')).toEqual(false);
  expect(agent.getData()).toEqual({ x: 100, y: false });

});

it('Retrieves a null value for data that does not exist.', () => {
  expect(agent.get('notfound')).toBeNull();
});
