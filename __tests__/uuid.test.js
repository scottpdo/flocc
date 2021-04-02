const { Agent, Environment, utils } = require("../dist/flocc");
const { uuid } = utils;

it("Generates a uuid of length 36", () => {
  const id = uuid();
  expect(id).toHaveLength(36);
});

it("Generates unique uuids", () => {
  const id = uuid();
  for (let i = 0; i < 50; i++) {
    expect(id).not.toEqual(uuid());
  }
});
