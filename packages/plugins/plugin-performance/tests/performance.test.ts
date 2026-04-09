import { describe, expect, it } from 'vitest';
import { createPerformancePlugin } from '../src/performance';

describe('createPerformancePlugin', () => {
  it('creates plugin with required hooks', () => {
    const plugin = createPerformancePlugin({}, () => undefined);

    expect(plugin.name).toBe('performance');
    expect(typeof plugin.install).toBe('function');
    expect(typeof plugin.onPlaying).toBe('function');
    expect(typeof plugin.onPublishing).toBe('function');
    expect(typeof plugin.onPreDestroy).toBe('function');
    expect(typeof plugin.uninstall).toBe('function');
  });
});
