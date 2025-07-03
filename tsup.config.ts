import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'rules/index': 'src/rules/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  outDir: 'dist',
  target: 'es2018',
  external: ['eslint'],
  noExternal: [],
  esbuildOptions(options) {
    options.platform = 'node';
  },
});
