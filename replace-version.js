const { readFileSync, writeFileSync } = require("fs");
const { version } = require("./package.json");

["./dist/flocc.js", "./dist/flocc.es.js"].forEach(filePath => {
  let flocc = readFileSync(filePath).toString();
  flocc = flocc.replace("%%VERSION%%", version);
  writeFileSync(filePath, flocc);
});
