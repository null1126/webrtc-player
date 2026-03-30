---
title: WebRTC Player - RtcPublisher API
description: RtcPublisher core class API documentation for publishing.
---

# RtcPublisher

Pushes local media streams to streaming servers.

## Constructor

```typescript
new RtcPublisher(options: RtcPublisherOptions)
```

## Methods

### start() <Badge type="tip" text="async" />

Start publishing.

```typescript
await publisher.start();
```

### stop()

Stop publishing.

```typescript
publisher.stop();
```

### switchSource(source) <Badge type="tip" text="async" />

Switch input source without rebuilding connection.

```typescript
await publisher.switchSource({ type: 'screen', audio: true });
```

### getStream()

Get local MediaStream.

```typescript
const stream = publisher.getStream();
```

### destroy()

Destroy instance and release resources.

```typescript
publisher.destroy();
```

## Events

| Event                | Description          |
| -------------------- | -------------------- |
| `state`              | Connection state     |
| `streamstart`        | Publishing started   |
| `streamstop`         | Publishing stopped   |
| `sourcechange`       | Input source changed |
| `permissiondenied`   | Permission denied    |
| `error`              | Error                |
| `iceconnectionstate` | ICE connection state |

See [Publishing Guide](../guide/publisher) and [PublisherOptions](./publisher-options).
