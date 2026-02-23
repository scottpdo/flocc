import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";

export default {
  input: "src/main.ts",
  output: [
    {
      file: "dist/flocc.js",
      format: "umd",
      name: "flocc"
    },
    {
      file: "dist/flocc.es.js",
      format: "es",
      name: "flocc"
    },
    {
      file: "client/dist/flocc.js",
      format: "umd",
      name: "flocc"
    }
  ],
  plugins: [
    json(),
    typescript({
      declaration: false,
      declarationDir: undefined,
      outDir: undefined
    })
  ]
};
