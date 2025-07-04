import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  outDir: 'dist',
  target: 'es2020',
  external: ['eslint'],
  noExternal: [],
  esbuildOptions(options) {
    options.platform = 'node';
  },
});
