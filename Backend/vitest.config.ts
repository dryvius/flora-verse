import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    exclude: ['dist/**', 'node_modules/**', 'src/generated/**'],
  },
});
