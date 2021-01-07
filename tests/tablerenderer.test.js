const { Agent, Environment, TableRenderer } = require("../dist/flocc");

it("Instantiates an empty TableRenderer", () => {
  const environment = new Environment();
  const renderer = new TableRenderer(environment);
  expect(renderer.environment).toBe(environment);
  expect(renderer.columns).toHaveLength(0);
  expect(renderer.lastRendered).toBeNull();
});

it("Can add columns to a TableRenderer", () => {
  const environment = new Environment();
  const renderer = new TableRenderer(environment);
  renderer.columns = ["x", "y"];
  expect(renderer.columns).toHaveLength(2);
  expect(renderer.columns).toEqual(["x", "y"]);
});

it("With no data, renders an empty table", () => {
  const environment = new Environment();
  const renderer = new TableRenderer(environment);
  expect(renderer.output()).toBe("<table></table>");
});

it("With no data, renders an empty CSV", () => {
  const environment = new Environment();
  const renderer = new TableRenderer(environment, { type: "csv" });
  expect(renderer.output()).toBe("");
});

it("Renders a header row for column names", () => {
  const environment = new Environment();
  const renderer = new TableRenderer(environment);
  renderer.columns = ["x", "y"];
  expect(renderer.output()).toBe(
    "<table><thead><tr><td>x</td><td>y</td></tr></thead></table>"
  );

  // manually change to CSV
  renderer.opts.type = "csv";
  expect(renderer.output()).toBe('"x","y"');
});

it("Renders tables and CSVs with agents", () => {
  const environment = new Environment();
  for (let i = 0; i < 3; i++) {
    environment.addAgent(new Agent({ i }));
  }
  const renderer = new TableRenderer(environment);
  renderer.columns = ["i"];
  expect(renderer.output()).toBe(
    "<table><thead><tr><td>i</td></tr></thead><tbody><tr><td>0</td></tr><tr><td>1</td></tr><tr><td>2</td></tr></tbody></table>"
  );

  // manually change to CSV
  renderer.opts.type = "csv";
  expect(renderer.output()).toBe('"i"\n0\n1\n2');
});

it("Escapes quotes in strings in CSVs", () => {
  const environment = new Environment();
  environment.addAgent(new Agent({ name: 'aa"' }));
  const renderer = new TableRenderer(environment, { type: "csv" });
  renderer.columns = ["name"];
  // need to escape the escape character
  expect(renderer.output()).toBe('"name"\n"aa\\""');
});

it("Can filter out data", () => {
  const environment = new Environment();
  for (let i = 0; i < 3; i++) {
    environment.addAgent(new Agent({ i }));
  }
  const renderer = new TableRenderer(environment, {
    filter: a => a.get("i") % 2 === 0
  });
  renderer.columns = ["i"];
  expect(renderer.output()).toBe(
    "<table><thead><tr><td>i</td></tr></thead><tbody><tr><td>0</td></tr><tr><td>2</td></tr></tbody></table>"
  );

  // manually change to CSV
  renderer.opts.type = "csv";
  expect(renderer.output()).toBe('"i"\n0\n2');
});

it("Can limit the # of rows rendered", () => {
  const environment = new Environment();
  for (let i = 0; i < 3; i++) {
    environment.addAgent(new Agent({ i }));
  }
  const renderer = new TableRenderer(environment, {
    limit: 2
  });
  renderer.columns = ["i"];
  expect(renderer.output()).toBe(
    "<table><thead><tr><td>i</td></tr></thead><tbody><tr><td>0</td></tr><tr><td>1</td></tr></tbody></table>"
  );

  // manually change to CSV
  renderer.opts.type = "csv";
  expect(renderer.output()).toBe('"i"\n0\n1');
});

/**
 * Since the output gets pretty gnarly to type in HTML,
 * only writing tests for CSV from here on out
 */

it("Can sort (ascending) by a given column", () => {
  const environment = new Environment();
  for (let i = 0; i < 3; i++) {
    environment.addAgent(new Agent({ i, j: 5 - i }));
  }
  const renderer = new TableRenderer(environment, {
    order: "asc",
    sortKey: "j",
    type: "csv"
  });
  renderer.columns = ["i", "j"];
  renderer.opts.type = "csv";
  expect(renderer.output()).toBe('"i","j"\n2,3\n1,4\n0,5');
});

it("Can sort (descending) by a given column", () => {
  const environment = new Environment();
  for (let i = 0; i < 3; i++) {
    environment.addAgent(new Agent({ i, j: 5 - i }));
  }
  const renderer = new TableRenderer(environment, {
    order: "desc",
    sortKey: "i",
    type: "csv"
  });
  renderer.columns = ["i", "j"];
  renderer.opts.type = "csv";
  expect(renderer.output()).toBe('"i","j"\n2,3\n1,4\n0,5');
});

it("Can display filtered, limited, and sorted data", () => {
  const environment = new Environment();
  for (let i = 0; i < 10; i++) {
    environment.addAgent(new Agent({ i, j: (2 * i) % 7 }));
  }
  const renderer = new TableRenderer(environment, {
    filter: a => a.get("i") < 7,
    sortKey: "j",
    order: "desc",
    limit: 4,
    type: "csv"
  });
  renderer.columns = ["i", "j"];
  renderer.opts.type = "csv";
  expect(renderer.output()).toBe('"i","j"\n3,6\n6,5\n2,4\n5,3');
});
