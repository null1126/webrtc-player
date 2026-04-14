import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../../vitest.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: '@webrtc-engine/plugin-performance',
      root: '.',
      include: ['tests/**/*.test.ts'],
      coverage: {
        reportsDirectory: './coverage',
      },
    },
  })
);
