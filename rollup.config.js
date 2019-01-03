import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/main.ts',
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
    typescript({
      typescript: require('typescript')
    })
  ]
};