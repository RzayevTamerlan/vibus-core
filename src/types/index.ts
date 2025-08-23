export type EventKey = string | symbol;
export type EventHandler<T = any> = (payload: T) => void;
export type WildcardEventHandler = (key: EventKey, payload?: any) => void;

export interface EventBus {
  on<T = any>(key: EventKey, handler: EventHandler<T>): () => void;
  once<T = any>(key: EventKey, handler: EventHandler<T>): () => void;
  off<T = any>(key: EventKey, handler: EventHandler<T>): void;
  emit<T = any>(key: EventKey, payload?: T): void;
  offAll(key?: EventKey): void;
  all(): Map<EventKey, Set<EventHandler>>;
}

export interface EventBusConfig {
  onError?: (error: Error, eventKey: EventKey, payload?: any) => void;
  maxListeners?: number;
}