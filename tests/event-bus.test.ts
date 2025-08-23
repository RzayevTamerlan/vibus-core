import { EventBusImpl, createEventBus } from '../src/event-bus';

describe('EventBus', () => {
  let bus: EventBusImpl;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    bus = createEventBus();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('should subscribe and emit events', () => {
    const mockHandler = jest.fn();
    bus.on('test', mockHandler);
    
    bus.emit('test', 'payload');
    
    expect(mockHandler).toHaveBeenCalledWith('payload');
  });

  test('should unsubscribe from events', () => {
    const mockHandler = jest.fn();
    const unsubscribe = bus.on('test', mockHandler);
    
    unsubscribe();
    bus.emit('test', 'payload');
    
    expect(mockHandler).not.toHaveBeenCalled();
  });

  test('should handle once subscriptions', () => {
    const mockHandler = jest.fn();
    bus.once('test', mockHandler);
    
    bus.emit('test', 'payload1');
    bus.emit('test', 'payload2');
    
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith('payload1');
  });

  test('should handle wildcard subscriptions', () => {
    const mockHandler = jest.fn();
    bus.onAll(mockHandler);
    
    bus.emit('test1', 'payload1');
    bus.emit('test2', 'payload2');
    
    expect(mockHandler).toHaveBeenCalledTimes(2);
    expect(mockHandler).toHaveBeenCalledWith('test1', 'payload1');
    expect(mockHandler).toHaveBeenCalledWith('test2', 'payload2');
  });

  test('should handle errors in handlers', () => {
    const errorHandler = jest.fn();
    const busWithErrorHandler = createEventBus({
      onError: errorHandler
    });
    
    const failingHandler = () => {
      throw new Error('Test error');
    };
    
    busWithErrorHandler.on('test', failingHandler);
    busWithErrorHandler.emit('test', 'payload');
    
    expect(errorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      'test',
      'payload'
    );
  });

  test('should handle errors in wildcard handlers', () => {
    const errorHandler = jest.fn();
    const busWithErrorHandler = createEventBus({
      onError: errorHandler
    });
    
    const failingHandler = () => {
      throw new Error('Test error');
    };
    
    busWithErrorHandler.onAll(failingHandler);
    busWithErrorHandler.emit('test', 'payload');
    
    expect(errorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      'test',
      'payload'
    );
  });

  test('should warn when max listeners exceeded', () => {
    const busWithLimit = createEventBus({ maxListeners: 1 });
    
    busWithLimit.on('test', jest.fn());
    busWithLimit.on('test', jest.fn());
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Event "test" has exceeded the maximum listeners (1)'
    );
  });

  test('should not warn when max listeners not exceeded', () => {
    const busWithLimit = createEventBus({ maxListeners: 2 });
    
    busWithLimit.on('test', jest.fn());
    busWithLimit.on('test', jest.fn());
    
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('should use default error handler when not provided', () => {
    const failingHandler = () => {
      throw new Error('Test error');
    };
    
    bus.on('test', failingHandler);
    bus.emit('test', 'payload');
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'EventBus error: Test error'
    );
  });

  test('should remove all handlers for a specific event with offAll(key)', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    
    bus.on('test1', handler1);
    bus.on('test2', handler2);
    
    bus.offAll('test1');
    
    bus.emit('test1', 'payload');
    bus.emit('test2', 'payload');
    
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  test('should remove all handlers with offAll()', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const wildcardHandler = jest.fn();
    
    bus.on('test1', handler1);
    bus.on('test2', handler2);
    bus.onAll(wildcardHandler);
    
    bus.offAll();
    
    bus.emit('test1', 'payload');
    bus.emit('test2', 'payload');
    
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
    expect(wildcardHandler).not.toHaveBeenCalled();
  });

  test('should return all handlers with all()', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    
    bus.on('test1', handler1);
    bus.on('test2', handler2);
    
    const allHandlers = bus.all();
    
    expect(allHandlers.has('test1')).toBe(true);
    expect(allHandlers.has('test2')).toBe(true);
    expect(allHandlers.get('test1')?.has(handler1)).toBe(true);
    expect(allHandlers.get('test2')?.has(handler2)).toBe(true);
  });

  test('should validate handler is a function', () => {
    // @ts-ignore - Testing invalid input
    expect(() => bus.on('test', 'not a function')).toThrow(
      'Event handler must be a function'
    );
  });

  test('should handle multiple handlers for the same event', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    
    bus.on('test', handler1);
    bus.on('test', handler2);
    
    bus.emit('test', 'payload');
    
    expect(handler1).toHaveBeenCalledWith('payload');
    expect(handler2).toHaveBeenCalledWith('payload');
  });

  test('should handle symbol events', () => {
    const symbolEvent = Symbol('test');
    const handler = jest.fn();
    
    bus.on(symbolEvent, handler);
    bus.emit(symbolEvent, 'payload');
    
    expect(handler).toHaveBeenCalledWith('payload');
  });

  test('should handle unsubscribe from wildcard handlers', () => {
    const handler = jest.fn();
    const unsubscribe = bus.onAll(handler);
    
    unsubscribe();
    bus.emit('test', 'payload');
    
    expect(handler).not.toHaveBeenCalled();
  });

  test('should handle empty payload', () => {
    const handler = jest.fn();
    
    bus.on('test', handler);
    bus.emit('test');
    
    expect(handler).toHaveBeenCalledWith(undefined);
  });

  test('should not fail when emitting event with no handlers', () => {
    expect(() => {
      bus.emit('nonexistent', 'payload');
    }).not.toThrow();
  });

  test('should not fail when unsubscribing from non-existent event', () => {
    const handler = jest.fn();
    
    expect(() => {
      bus.off('nonexistent', handler);
    }).not.toThrow();
  });

  test('should handle once subscription with error', () => {
    const errorHandler = jest.fn();
    const busWithErrorHandler = createEventBus({
      onError: errorHandler
    });
    
    const failingHandler = () => {
      throw new Error('Test error');
    };
    
    busWithErrorHandler.once('test', failingHandler);
    busWithErrorHandler.emit('test', 'payload');
    
    expect(errorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      'test',
      'payload'
    );
  });
});