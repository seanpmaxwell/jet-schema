/* eslint-disable max-len */
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';


export default [
  {
    input: 'src/index.ts', // Entry point of your application
    output: {
      file: 'dist/index.min.mjs', // Output file
      format: 'esm', // Format of the output bundle (e.g., 'cjs', 'esm', 'iife', 'umd')
    },
    plugins: [
      typescript({
        compilerOptions: {
          target: 'esnext',
          module: 'esnext',
        },
      }),
      terser(),
    ],
  },
  {
    input: 'dist/index.min.mjs', // Entry point of your application
    output: {
      file: 'dist/index.min.js', // Output file
      format: 'cjs', // Format of the output bundle (e.g., 'cjs', 'esm', 'iife', 'umd')
    },
  },
];
