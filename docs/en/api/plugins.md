---
title: WebRTC Player - Plugin API
description: WebRTC Player plugin system API reference — complete type definitions for plugin interfaces, hooks, and PluginPhase.
---

# Plugin API

This document is a complete reference for the plugin system core types and interfaces.

## Import

All plugin types are exported from `@webrtc-player/core`:

```typescript
import type {
  RtcPlayerPlugin,
  RtcPublisherPlugin,
  RtcPlayerPluginInstance,
  RtcPublisherPluginInstance,
  RtcPluginCommonHooks,
  RtcPlayerPluginHooks,
  RtcPublisherPluginHooks,
  PluginPhase,
} from '@webrtc-player/core';
```

## Interfaces

### `RtcBasePlugin<I>`

Base interface for all plugins.

```typescript
interface RtcBasePlugin<I = unknown> {
  /** Unique plugin name */
  name: string;

  /** Execution priority; higher runs first, default 0 */
  priority?: number;

  /** Called during plugin registration; initialize resources here */
  install?(instance: I): void | Promise<void>;

  /** Called when plugin is removed; clean up resources here */
  uninstall?(): void | Promise<void>;
}
```

### `RtcPlayerPlugin`

Player plugin interface — combines `RtcBasePlugin<RtcPlayerPluginInstance>`, `RtcPluginCommonHooks<RtcPlayerPluginInstance>`, and `RtcPlayerPluginHooks`.

```typescript
interface RtcPlayerPlugin
  extends
    RtcBasePlugin<RtcPlayerPluginInstance>,
    RtcPluginCommonHooks<RtcPlayerPluginInstance>,
    RtcPlayerPluginHooks {}
```

### `RtcPublisherPlugin`

Publisher plugin interface — combines `RtcBasePlugin<RtcPublisherPluginInstance>`, `RtcPluginCommonHooks<RtcPublisherPluginInstance>`, and `RtcPublisherPluginHooks`.

```typescript
interface RtcPublisherPlugin
  extends
    RtcBasePlugin<RtcPublisherPluginInstance>,
    RtcPluginCommonHooks<RtcPublisherPluginInstance>,
    RtcPublisherPluginHooks {}
```

### `RtcPluginCommonHooks<S>`

Hooks shared between player and publisher plugins.

```typescript
interface RtcPluginCommonHooks<S> {
  /** After RTCPeerConnection is created */
  onPeerConnectionCreated?(pc: RTCPeerConnection): void;

  /** When an ICE candidate is gathered */
  onIceCandidate?(candidate: RTCIceCandidate): void;

  /**
   * Before an ICE candidate is added (Pipe Hook)
   * Return null to skip this candidate; return a modified candidate to replace it
   */
  onBeforeICESetCandidate?(candidate: RTCIceCandidate): RTCIceCandidate | null | void;

  /** Connection state changed */
  onConnectionStateChange?(state: RTCPeerConnectionState): void;

  /** ICE connection state changed */
  onIceConnectionStateChange?(state: RTCIceConnectionState): void;

  /** ICE gathering state changed */
  onIceGatheringStateChange?(state: RTCIceGatheringState): void;

  /**
   * When an error occurs (Pipe Hook)
   * Return true to suppress the default error event
   */
  onError?(error: string): boolean | void;

  /** Cleanup before destroy */
  onPreDestroy?(): void | Promise<void>;

  /** After destroy (RTCPeerConnection already closed) */
  onPostDestroy?(): void | Promise<void>;
}
```

### `RtcPlayerPluginHooks`

Player-specific hooks.

```typescript
interface RtcPlayerPluginHooks {
  /** Before connecting (Pipe Hook); can modify connection options */
  onBeforeConnect?(options: RtcPlayerOptions): RtcPlayerOptions | void;

  /** Before setLocalDescription (Pipe Hook); can modify offer SDP */
  onBeforeSetLocalDescription?(offer: RTCSessionDescriptionInit): RTCSessionDescriptionInit | void;

  /** Before setRemoteDescription (Pipe Hook); can modify answer SDP */
  onBeforeSetRemoteDescription?(
    answer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;

  /** After setRemoteDescription */
  onRemoteDescriptionSet?(): void;

  /** When a remote track is received */
  onTrack?(track: MediaStreamTrack, stream: MediaStream): void;

  /** Before video.srcObject assignment (Pipe Hook); can replace the stream */
  onBeforeVideoPlay?(stream: MediaStream): MediaStream | void;

  /** When video starts playing */
  onPlaying?(): void;

  /** Before stream switch (Pipe Hook) */
  onBeforeSwitchStream?(url: string): string | void;

  /** After stream switch */
  onAfterSwitchStream?(url: string): void;
}
```

### `RtcPublisherPluginHooks`

Publisher-specific hooks.

```typescript
interface RtcPublisherPluginHooks {
  /** Before getUserMedia (Pipe Hook); can modify media constraints */
  onBeforeGetUserMedia?(constraints: MediaStreamConstraints): MediaStreamConstraints | void;

  /** After MediaStream is obtained */
  onMediaStream?(stream: MediaStream): void;

  /** Before tracks are attached to PC (AsyncPipe Hook); can replace the stream */
  onBeforeAttachStream?(stream: MediaStream): MediaStream | void;

  /** Before individual track is attached (AsyncPipe Hook); can replace/remove a single track */
  onBeforeAttachTrack?(track: MediaStreamTrack, stream: MediaStream): MediaStreamTrack | void;

  /** After a track is attached to PC */
  onTrackAttached?(track: MediaStreamTrack, stream: MediaStream): void;

  /** Before setLocalDescription (Pipe Hook) */
  onBeforeSetLocalDescription?(offer: RTCSessionDescriptionInit): RTCSessionDescriptionInit | void;

  /** Before setRemoteDescription (Pipe Hook) */
  onBeforeSetRemoteDescription?(
    answer: RTCSessionDescriptionInit
  ): RTCSessionDescriptionInit | void;

  /** After setRemoteDescription */
  onRemoteDescriptionSet?(): void;

  /** Before replaceTrack (Pipe Hook) */
  onBeforeReplaceTrack?(track: MediaStreamTrack | null): MediaStreamTrack | null | void;

  /** After replaceTrack */
  onAfterReplaceTrack?(): void;

  /** Remote track received (for echo scenarios) */
  onTrack?(track: MediaStreamTrack, stream: MediaStream): void;

  /** Streaming state changed */
  onStreamingStateChange?(state: 'idle' | 'connecting' | 'streaming'): void;

  /** Streaming started */
  onPublishing?(): void;

  /** Streaming stopped */
  onUnpublishing?(): void;

  /** Before source switch (Pipe Hook) */
  onBeforeSourceChange?(source: MediaSource): MediaSource | void;

  /** After source switch */
  onAfterSourceChange?(source: MediaSource): void;
}
```

### `RtcPlayerPluginInstance`

Read-only context passed to plugins during `install()`.

```typescript
interface RtcPlayerPluginInstance {
  readonly connectionState: RTCPeerConnectionState;
  getStreamUrl(): string;
  getVideoElement(): HTMLVideoElement | undefined;
  getCurrentStream(): MediaStream | null;
  getPeerConnection(): RTCPeerConnection | null;
}
```

### `RtcPublisherPluginInstance`

Read-only context passed to publisher plugins during `install()`.

```typescript
interface RtcPublisherPluginInstance {
  readonly source: RtcMediaSource;
  readonly connectionState: RTCPeerConnectionState;
  getStream(): MediaStream | null;
  getPeerConnection(): RTCPeerConnection | null;
}
```

## PluginPhase

`PluginPhase` constants map each lifecycle stage to a named phase.

```typescript
export const PluginPhase = {
  // Common
  ERROR: 'error',
  PEER_CONNECTION_CREATED: 'peerConnectionCreated',

  // Player
  PLAYER_BEFORE_CONNECT: 'player:beforeConnect',
  PLAYER_CONNECTING: 'player:connecting',
  PLAYER_BEFORE_SET_LOCAL_DESCRIPTION: 'player:beforeSetLocalDescription',
  PLAYER_BEFORE_SET_REMOTE_DESCRIPTION: 'player:beforeSetRemoteDescription',
  PLAYER_REMOTE_DESCRIPTION_SET: 'player:remoteDescriptionSet',
  PLAYER_TRACK: 'player:track',
  PLAYER_BEFORE_VIDEO_PLAY: 'player:beforeVideoPlay',
  PLAYER_VIDEO_PLAYING: 'player:videoPlaying',
  PLAYER_FRAME: 'player:frame',
  PLAYER_BEFORE_SWITCH_STREAM: 'player:beforeSwitchStream',
  PLAYER_AFTER_SWITCH_STREAM: 'player:afterSwitchStream',
  PLAYER_DESTROY: 'player:destroy',

  // Publisher
  PUBLISHER_STARTING: 'publisher:starting',
  PUBLISHER_BEFORE_GET_USER_MEDIA: 'publisher:beforeGetUserMedia',
  PUBLISHER_MEDIA_STREAM: 'publisher:mediaStream',
  PUBLISHER_BEFORE_ATTACH_STREAM: 'publisher:beforeAttachStream',
  PUBLISHER_BEFORE_ATTACH_TRACK: 'publisher:beforeAttachTrack',
  PUBLISHER_TRACK_ATTACHED: 'publisher:trackAttached',
  PUBLISHER_BEFORE_SET_LOCAL_DESCRIPTION: 'publisher:beforeSetLocalDescription',
  PUBLISHER_BEFORE_SET_REMOTE_DESCRIPTION: 'publisher:beforeSetRemoteDescription',
  PUBLISHER_REMOTE_DESCRIPTION_SET: 'publisher:remoteDescriptionSet',
  PUBLISHER_STREAM_START: 'publisher:streamStart',
  PUBLISHER_STREAMING_STATE_CHANGE: 'publisher:streamingStateChange',
  PUBLISHER_STREAM_STOP: 'publisher:streamStop',
  PUBLISHER_BEFORE_SOURCE_CHANGE: 'publisher:beforeSourceChange',
  PUBLISHER_AFTER_SOURCE_CHANGE: 'publisher:afterSourceChange',
  PUBLISHER_BEFORE_REPLACE_TRACK: 'publisher:beforeReplaceTrack',
  PUBLISHER_AFTER_REPLACE_TRACK: 'publisher:afterReplaceTrack',
  PUBLISHER_DESTROY: 'publisher:destroy',
} as const;
```

## Hook Types

Each hook falls into one of two call semantics:

| Type                  | Meaning         | Plugin behavior                                                  |
| --------------------- | --------------- | ---------------------------------------------------------------- |
| `RtcPlayerNotifyHook` | Fire-and-forget | Return value ignored; errors do not propagate                    |
| `RtcPlayerPipeHook`   | Sync pipeline   | First non-undefined return value becomes the next plugin's input |

```typescript
type RtcPlayerNotifyHook =
  | 'onPeerConnectionCreated'
  | 'onIceCandidate'
  | 'onConnectionStateChange'
  | 'onIceConnectionStateChange'
  | 'onIceGatheringStateChange'
  | 'onRemoteDescriptionSet'
  | 'onTrack'
  | 'onPlaying'
  | 'onAfterSwitchStream'
  | 'onPreDestroy'
  | 'onPostDestroy';

type RtcPlayerPipeHook =
  | 'onBeforeConnect'
  | 'onBeforeICESetCandidate'
  | 'onBeforeSetLocalDescription'
  | 'onBeforeSetRemoteDescription'
  | 'onBeforeVideoPlay'
  | 'onBeforeSwitchStream'
  | 'onError';
```
