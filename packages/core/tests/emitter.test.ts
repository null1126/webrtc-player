import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from '../src/utils/emitter';

type Events = {
  ready: { id: number };
  close: undefined;
};

describe('EventEmitter', () => {
  it('supports on + emit', () => {
    const emitter = new EventEmitter<Events>();
    const handler = vi.fn();

    emitter.on('ready', handler);
    emitter.emit('ready', { id: 1 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ id: 1 });
  });

  it('supports off', () => {
    const emitter = new EventEmitter<Events>();
    const handler = vi.fn();

    emitter.on('ready', handler);
    emitter.off('ready', handler);
    emitter.emit('ready', { id: 2 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('supports once', () => {
    const emitter = new EventEmitter<Events>();
    const handler = vi.fn();

    emitter.once('ready', handler);
    emitter.emit('ready', { id: 3 });
    emitter.emit('ready', { id: 4 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ id: 3 });
  });
});
