const { readFileSync, writeFileSync } = require("fs");
const { version } = require("./package.json");

let flocc = readFileSync("./dist/flocc.js").toString();
flocc = flocc.replace("%%VERSION%%", version);
writeFileSync("./dist/flocc.js", flocc);
