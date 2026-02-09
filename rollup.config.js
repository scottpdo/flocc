import typescript from "@rollup/plugin-typescript";

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
    typescript({
      declaration: false,
      declarationDir: undefined,
      outDir: undefined
    })
  ]
};
