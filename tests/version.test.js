const flocc = require("../dist/flocc");
const { version } = require("../package.json");

it("Exports the version that is in package.json", () => {
  expect(flocc.VERSION).toBe(version);
});
