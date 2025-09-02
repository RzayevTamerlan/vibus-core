import { EventBus, EventHandler, EventKey, EventBusConfig, WildcardEventHandler } from '../types';

export class EventBusImpl implements EventBus {
  private handlers = new Map<EventKey, Set<EventHandler>>();
  private wildcardHandlers = new Set<WildcardEventHandler>();
  private config: EventBusConfig;

  constructor(config: EventBusConfig = {}) {
    this.config = {
      onError: (error) => console.error(`EventBus error: ${error.message}`),
      maxListeners: 20,
      ...config
    };
  }

  on<T = any>(key: EventKey, handler: EventHandler<T>): () => void {
    this.validateHandler(handler);

    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }

    const handlers = this.handlers.get(key)!;

    if (this.config.maxListeners && handlers.size >= this.config.maxListeners) {
      console.warn(`Event "${String(key)}" has exceeded the maximum listeners (${this.config.maxListeners})`);
    }

    handlers.add(handler);

    return () => this.off(key, handler);
  }

  once<T = any>(key: EventKey, handler: EventHandler<T>): () => void {
    const onceHandler: EventHandler<T> = (payload) => {
      try {
        handler(payload);
      } finally {
        this.off(key, onceHandler);
      }
    };

    return this.on(key, onceHandler);
  }

  off<T = any>(key: EventKey, handler: EventHandler<T>): void {
    if (!this.handlers.has(key)) return;

    const handlers = this.handlers.get(key)!;
    handlers.delete(handler);

    if (handlers.size === 0) {
      this.handlers.delete(key);
    }
  }

  /**
* Unsubscribes all handlers for a specific event, or all handlers
* for all events (including wildcard handlers) if no key is provided.
* @param key The event key to clear handlers for. If omitted, all handlers are cleared.
*/
  offAll(key?: EventKey): void {
    if (key) {
      this.handlers.delete(key);
    } else {
      this.handlers.clear();
      this.wildcardHandlers.clear();
    }
  }

  emit<T = any>(key: EventKey, payload?: T): void {
    if (this.handlers.has(key)) {
      const handlers = new Set(this.handlers.get(key));

      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          this.config.onError?.(error as Error, key, payload);
        }
      });
    }

    this.wildcardHandlers.forEach(handler => {
      try {
        handler(key, payload);
      } catch (error) {
        this.config.onError?.(error as Error, key, payload);
      }
    });
  }

  onAll(handler: WildcardEventHandler): () => void {
    this.wildcardHandlers.add(handler);

    return () => {
      this.wildcardHandlers.delete(handler);
    };
  }

  all(): Map<EventKey, Set<EventHandler>> {
    return new Map(this.handlers);
  }

  private validateHandler(handler: Function): void {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }
  }
}

export const createEventBus = (config?: EventBusConfig) => new EventBusImpl(config);
export const eventBus = createEventBus();