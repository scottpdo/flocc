import VERSION from './version';

it("Exports the version that is in package.json", () => {
  const { version } = require('../package.json') as { version: string };
  expect(VERSION).toBe(version);
});
