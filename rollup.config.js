import babel from 'rollup-plugin-babel';

export default {
  input: 'main.js',
  output: [
    {
      file: 'flocc.js',
      format: 'umd',
      name: 'flocc'
    },
    {
      file: 'flocc.es.js',
      format: 'es',
      name: 'flocc'
    }
  ],
  plugins: [
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  ]
};