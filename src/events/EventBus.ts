import type { Agent } from "../agents/Agent";
import type { Environment } from "../environments/Environment";

/**
 * Event object passed to event handlers.
 * @since 0.6.0
 */
interface FloccEvent<T = any> {
  /** Event type identifier */
  type: string;
  /** The agent or environment that emitted this event */
  source: Agent | Environment | null;
  /** Event payload data */
  data: T;
  /** Environment time when the event was emitted */
  time: number;
  /** Whether propagation has been stopped */
  propagationStopped: boolean;
  /** Stop this event from reaching subsequent handlers */
  stopPropagation(): void;
}

/**
 * Event handler function signature.
 */
type EventHandler<T = any> = (event: FloccEvent<T>) => void;

/**
 * Configuration for agent-level event handlers.
 */
interface AgentEventConfig<T = any> {
  handler: (agent: Agent, event: FloccEvent<T>) => void;
}

/**
 * A publish-subscribe event bus for agent and environment events.
 * 
 * @example
 * ```js
 * const events = new EventBus();
 * const env = new Environment({ events });
 * 
 * // Subscribe to events
 * events.on('food:found', (event) => {
 *   console.log('Food found at', event.data.location);
 * });
 * 
 * // Emit events
 * events.emit('food:found', { location: { x: 10, y: 20 } });
 * ```
 * 
 * @since 0.6.0
 */
class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private environment: Environment | null = null;

  /**
   * Link this EventBus to an environment.
   * Called automatically when passing the EventBus to Environment constructor.
   * @hidden
   */
  setEnvironment(env: Environment): void {
    this.environment = env;
  }

  /**
   * Subscribe to an event type.
   * @param type - Event type to listen for
   * @param handler - Function to call when event is emitted
   * @returns Unsubscribe function
   * 
   * @example
   * ```js
   * const unsubscribe = events.on('tick:end', (event) => {
   *   console.log('Tick completed at time', event.time);
   * });
   * 
   * // Later, to stop listening:
   * unsubscribe();
   * ```
   */
  on<T = any>(type: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler as EventHandler);
    };
  }

  /**
   * Subscribe to an event type, but only fire once.
   * @param type - Event type to listen for
   * @param handler - Function to call when event is emitted
   * @returns Unsubscribe function (can cancel before event fires)
   */
  once<T = any>(type: string, handler: EventHandler<T>): () => void {
    const wrappedHandler: EventHandler<T> = (event) => {
      unsubscribe();
      handler(event);
    };
    const unsubscribe = this.on(type, wrappedHandler);
    return unsubscribe;
  }

  /**
   * Emit an event to all subscribers.
   * @param type - Event type
   * @param data - Event payload
   * @param source - The agent or environment emitting the event
   * 
   * @example
   * ```js
   * events.emit('predator:attack', { 
   *   target: preyAgent,
   *   damage: 10 
   * }, predatorAgent);
   * ```
   */
  emit<T = any>(type: string, data: T, source: Agent | Environment | null = null): void {
    const event: FloccEvent<T> = {
      type,
      source,
      data,
      time: this.environment?.time ?? 0,
      propagationStopped: false,
      stopPropagation() {
        this.propagationStopped = true;
      },
    };

    const handlers = this.handlers.get(type);
    if (handlers) {
      const handlerArray = Array.from(handlers);
      for (let i = 0; i < handlerArray.length; i++) {
        if (event.propagationStopped) break;
        try {
          handlerArray[i](event);
        } catch (error) {
          console.error(`Error in event handler for "${type}":`, error);
        }
      }
    }
  }

  /**
   * Remove all handlers for a specific event type.
   * @param type - Event type to clear handlers for
   */
  off(type: string): void {
    this.handlers.delete(type);
  }

  /**
   * Remove all handlers for all event types.
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Check if there are any handlers for an event type.
   * @param type - Event type to check
   */
  hasHandlers(type: string): boolean {
    const handlers = this.handlers.get(type);
    return handlers !== undefined && handlers.size > 0;
  }

  /**
   * Get the number of handlers for an event type.
   * @param type - Event type to check
   */
  handlerCount(type: string): number {
    return this.handlers.get(type)?.size ?? 0;
  }
}

export { EventBus, FloccEvent, EventHandler, AgentEventConfig };
