import { describe, expect, it, vi } from 'vitest';
import { PluginManager } from '../src/plugins/manager';

describe('PluginManager', () => {
  it('sorts plugins by priority and avoids duplicate names', () => {
    const manager = new PluginManager<any, { id: string }>();
    const installLow = vi.fn();
    const installHigh = vi.fn();

    manager.setInstance({ id: 'host' });
    manager.use({ name: 'low', priority: 1, install: installLow });
    manager.use({ name: 'high', priority: 10, install: installHigh });
    manager.use({ name: 'high', priority: 100 });

    expect(manager.list().map((p) => p.name)).toEqual(['high', 'low']);
    expect(installLow).toHaveBeenCalledTimes(1);
    expect(installHigh).toHaveBeenCalledTimes(1);
  });

  it('calls and uninstalls plugins', () => {
    const manager = new PluginManager<any, unknown>();
    const events: string[] = [];

    manager.use({
      name: 'a',
      priority: 1,
      onReconnected() {
        events.push('a-hook');
      },
      uninstall() {
        events.push('a-uninstall');
      },
    });

    manager.use({
      name: 'b',
      priority: 2,
      onReconnected() {
        events.push('b-hook');
      },
      uninstall() {
        events.push('b-uninstall');
      },
    });

    manager.callHook({ instance: {}, phase: 'peerConnectionCreated' as any }, 'onReconnected');
    expect(events).toEqual(['b-hook', 'a-hook']);

    manager.unuse('b');
    manager.unuseAll();
    expect(events).toContain('b-uninstall');
    expect(events).toContain('a-uninstall');
  });

  it('pipes first defined return value through sync/async pipe hooks', async () => {
    const manager = new PluginManager<any, unknown>();

    manager.use({
      name: 'p1',
      priority: 3,
      onBeforeConnect: (_ctx: unknown, options: { url: string }) => ({
        ...options,
        url: `${options.url}?token=1`,
      }),
      onBeforeAttachTrack: async (_ctx: unknown, track: { id: string }) => ({
        ...track,
        id: `${track.id}-processed`,
      }),
    });

    manager.use({
      name: 'p2',
      priority: 1,
      onBeforeConnect: vi.fn(),
      onBeforeAttachTrack: vi.fn(),
    });

    const syncResult = manager.pipeHook(
      { instance: {}, phase: 'player:beforeConnect' as any },
      'onBeforeConnect',
      { url: 'webrtc://demo' }
    );
    expect(syncResult).toEqual({ url: 'webrtc://demo?token=1' });

    const asyncResult = await manager.asyncPipeHook(
      { instance: {}, phase: 'publisher:beforeAttachTrack' as any },
      'onBeforeAttachTrack',
      { id: 'v1' },
      { getTracks: () => [] }
    );
    expect(asyncResult).toEqual({ id: 'v1-processed' });
  });
});
