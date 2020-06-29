const { Agent, Environment, TableRenderer } = require("../dist/flocc");

it("Instantiates a TableRenderer", () => {
  const environment = new Environment();
  for (let i = 0; i < 3; i++) {
    environment.addAgent(new Agent({ i }));
  }
  const renderer = new TableRenderer(environment);
  renderer.columns = ["i"];
  expect(renderer.output()).toBe("i\n0\n1\n2");
});
