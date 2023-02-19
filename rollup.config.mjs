import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import {terser} from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';

const extensions = ['.ts', '.tsx'];
const external = [/@babel\/runtime/, 'chalk'];

const options = [
  {
    input: 'src/cli.ts',
    output: {
      sourcemap: true,
      dir: 'dist/script',
      format: 'cjs',
    },
    tsconfigOptions: {
      include: ['src/cli.ts'],
    },
  },
  {
    input: 'src/index.ts',
    output: {
      sourcemap: true,
      dir: 'dist/lib',
      format: 'esm',
      preserveModules: true,
    },
    tsconfigOptions: {exclude: ['src/mode/*']},
  },
];

/** @returns {import('rollup').RollupOptions} */
const makeConfig = (opt) => {
  return {
    input: opt.input,
    output: opt.output,
    external,
    // 순서중요
    plugins: [
      json(),
      nodeResolve({extensions, preferBuiltins: true}),
      commonjs(),
      peerDepsExternal(),
      typescript({clean: true, ...opt.tsconfigOptions}),
      // When using @rollup/plugin-babel with @rollup/plugin-commonjs in the same Rollup configuration, it's important to note that @rollup/plugin-commonjs must be placed before this plugin
      babel({babelHelpers: 'runtime', extensions}),
      terser(),
    ],
  };
};

export default options.map((option) => makeConfig(option));
