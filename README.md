# EventBus Library

A lightweight, type-safe event bus implementation for TypeScript/JavaScript applications. This library provides a simple and flexible way to implement the observer pattern with support for wildcards, error handling, and listener management.

## Features

- ✅ **Type-safe**: Full TypeScript support with generic event payloads
- ✅ **Wildcard listeners**: Listen to all events with a single handler
- ✅ **Error handling**: Configurable error handling for failed event handlers
- ✅ **Memory management**: Automatic cleanup and listener limits
- ✅ **One-time listeners**: Built-in support for `once` functionality
- ✅ **Zero dependencies**: Lightweight and self-contained

## Installation

```bash
npm install vibus-core
# or
yarn add vibus-core
```

## Quick Start

```typescript
import { eventBus } from 'vibus-core';

// Subscribe to an event
const unsubscribe = eventBus.on('user:login', (user) => {
  console.log('User logged in:', user.name);
});

// Emit an event
eventBus.emit('user:login', { name: 'John Doe', id: 123 });

// Unsubscribe
unsubscribe();
```

## API Reference

### Creating an EventBus Instance

```typescript
import { createEventBus } from 'vibus-core';

const eventBus = createEventBus({
  maxListeners: 50,
  onError: (error, eventKey, payload) => {
    console.error(`Error in event ${String(eventKey)}:`, error);
  }
});
```

### Configuration Options

```typescript
interface EventBusConfig {
  maxListeners?: number;           // Maximum listeners per event (default: 20)
  onError?: (                      // Error handler for failed listeners
    error: Error, 
    eventKey: EventKey, 
    payload?: any
  ) => void;
}
```

### Core Methods

#### `on<T>(key: EventKey, handler: EventHandler<T>): () => void`

Subscribe to an event. Returns an unsubscribe function.

```typescript
const unsubscribe = eventBus.on('data:update', (data) => {
  console.log('Data updated:', data);
});

// Later...
unsubscribe();
```

#### `once<T>(key: EventKey, handler: EventHandler<T>): () => void`

Subscribe to an event that will only be triggered once.

```typescript
eventBus.once('app:ready', () => {
  console.log('App is ready!');
});
```

#### `emit<T>(key: EventKey, payload?: T): void`

Emit an event with optional payload.

```typescript
eventBus.emit('notification', {
  type: 'success',
  message: 'Operation completed'
});
```

#### `off<T>(key: EventKey, handler: EventHandler<T>): void`

Remove a specific event handler.

```typescript
const handler = (data) => console.log(data);
eventBus.on('test', handler);
eventBus.off('test', handler);
```

#### `offAll(key?: EventKey): void`

Remove all handlers for a specific event, or all handlers if no key is provided.

```typescript
// Remove all handlers for 'user:login'
eventBus.offAll('user:login');

// Remove all handlers for all events
eventBus.offAll();
```

#### `onAll(handler: WildcardEventHandler): () => void`

Listen to all events with a wildcard handler.

```typescript
const unsubscribe = eventBus.onAll((eventKey, payload) => {
  console.log(`Event ${String(eventKey)} emitted with:`, payload);
});
```

#### `all(): Map<EventKey, Set<EventHandler>>`

Get a copy of all current event handlers (useful for debugging).

```typescript
const allHandlers = eventBus.all();
console.log('Current handlers:', allHandlers);
```

## Usage Examples

### Basic Event Communication

```typescript
import { eventBus } from 'vibus-core';

// Component A - Publisher
function saveUser(userData) {
  // Save user logic...
  eventBus.emit('user:saved', userData);
}

// Component B - Subscriber
eventBus.on('user:saved', (userData) => {
  console.log('User saved:', userData.name);
  // Update UI, send analytics, etc.
});
```

### Type-Safe Events

```typescript
interface UserLoginEvent {
  userId: string;
  timestamp: Date;
  ipAddress: string;
}

eventBus.on<UserLoginEvent>('user:login', (event) => {
  // event is now typed as UserLoginEvent
  console.log(`User ${event.userId} logged in at ${event.timestamp}`);
});

eventBus.emit<UserLoginEvent>('user:login', {
  userId: '123',
  timestamp: new Date(),
  ipAddress: '192.168.1.1'
});
```

### Error Handling

```typescript
const eventBus = createEventBus({
  onError: (error, eventKey, payload) => {
    // Log to external service
    console.error(`Event handler failed for ${String(eventKey)}:`, error);
    
    // Optional: emit an error event
    eventBus.emit('system:error', { error, eventKey, payload });
  }
});

eventBus.on('risky:operation', () => {
  throw new Error('Something went wrong');
});

// This won't crash the app, error will be handled by onError
eventBus.emit('risky:operation');
```

### Cleanup in React Components

```typescript
import { useEffect } from 'react';
import { eventBus } from 'vibus-core';

function MyComponent() {
  useEffect(() => {
    const unsubscribe = eventBus.on('data:update', (data) => {
      // Handle data update
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  return <div>My Component</div>;
}
```

### Multiple Event Types

```typescript
// Using string keys
eventBus.on('user:login', handler);
eventBus.on('user:logout', handler);

// Using symbols for private events
const INTERNAL_EVENT = Symbol('internal');
eventBus.on(INTERNAL_EVENT, handler);

// Using numbers
eventBus.on(404, handler);
```

### Wildcard Logging

```typescript
// Development logging
if (process.env.NODE_ENV === 'development') {
  eventBus.onAll((eventKey, payload) => {
    console.log(`[EventBus] ${String(eventKey)}`, payload);
  });
}
```

## Best Practices

1. **Use descriptive event names**: Use namespaced event names like `user:login`, `api:error`, `ui:modal:close`

2. **Type your events**: Define interfaces for event payloads to ensure type safety

3. **Handle cleanup**: Always unsubscribe from events to prevent memory leaks

4. **Error boundaries**: Use the `onError` configuration to handle failing event handlers gracefully

5. **Limit listeners**: Set appropriate `maxListeners` limits to detect potential memory leaks

6. **Use symbols for private events**: Use `Symbol()` for internal events that shouldn't be accessible from outside modules

## TypeScript Definitions

```typescript
type EventKey = string | symbol | number;
type EventHandler<T = any> = (payload?: T) => void;
type WildcardEventHandler = (eventKey: EventKey, payload?: any) => void;

interface EventBusConfig {
  maxListeners?: number;
  onError?: (error: Error, eventKey: EventKey, payload?: any) => void;
}

interface EventBus {
  on<T = any>(key: EventKey, handler: EventHandler<T>): () => void;
  once<T = any>(key: EventKey, handler: EventHandler<T>): () => void;
  off<T = any>(key: EventKey, handler: EventHandler<T>): void;
  offAll(key?: EventKey): void;
  emit<T = any>(key: EventKey, payload?: T): void;
  onAll(handler: WildcardEventHandler): () => void;
  all(): Map<EventKey, Set<EventHandler>>;
}
```

## License

MIT License