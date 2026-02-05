import type { Agent } from "../agents/Agent";
import type { Scheduler } from "./Scheduler";

/**
 * Configuration for an agent's tick schedule.
 */
interface AgentScheduleConfig {
  /** Tick every N environment ticks (default: 1) */
  interval: number;
  /** Offset for staggering agents with same interval */
  offset: number;
  /** Probability of ticking each eligible tick (0-1, default: 1) */
  probability: number;
}

/**
 * The default interval-based scheduler.
 * 
 * Agents tick based on their configured interval:
 * - `interval: 1` means tick every environment tick (default)
 * - `interval: 5` means tick every 5th environment tick
 * - `probability: 0.5` means 50% chance to tick on eligible ticks
 * 
 * @example
 * ```js
 * // Fast agent - ticks every step
 * const fastAgent = new Agent({ tickInterval: 1 });
 * 
 * // Slow agent - ticks every 5 steps
 * const slowAgent = new Agent({ tickInterval: 5 });
 * 
 * // Stochastic agent - 30% chance per step
 * const randomAgent = new Agent({ tickProbability: 0.3 });
 * ```
 * 
 * @since 0.6.0
 */
class DefaultScheduler implements Scheduler {
  private configs: Map<Agent, AgentScheduleConfig> = new Map();

  /**
   * Schedule an agent with interval-based timing.
   * For DefaultScheduler, the `time` parameter is used as the offset.
   */
  schedule(agent: Agent, time: number): void {
    const existing = this.configs.get(agent);
    if (existing) {
      existing.offset = time;
    } else {
      this.configs.set(agent, {
        interval: 1,
        offset: time,
        probability: 1,
      });
    }
  }

  /**
   * Configure an agent's tick interval.
   */
  setInterval(agent: Agent, interval: number): void {
    const config = this.configs.get(agent);
    if (config) {
      config.interval = Math.max(1, Math.floor(interval));
    }
  }

  /**
   * Configure an agent's tick probability.
   */
  setProbability(agent: Agent, probability: number): void {
    const config = this.configs.get(agent);
    if (config) {
      config.probability = Math.max(0, Math.min(1, probability));
    }
  }

  /**
   * Get an agent's current schedule configuration.
   */
  getConfig(agent: Agent): AgentScheduleConfig | undefined {
    return this.configs.get(agent);
  }

  unschedule(agent: Agent): void {
    this.configs.delete(agent);
  }

  getAgentsForTick(time: number): Agent[] {
    const result: Agent[] = [];

    this.configs.forEach((config, agent) => {
      // Check if this tick aligns with agent's interval
      if ((time - config.offset) % config.interval !== 0) {
        return;
      }

      // Check probability
      if (config.probability < 1 && Math.random() >= config.probability) {
        return;
      }

      result.push(agent);
    });

    return result;
  }

  nextScheduledTime(): number | null {
    // For interval-based scheduling, there's always a next time
    // as long as there are agents scheduled
    return this.configs.size > 0 ? null : null;
  }

  onAgentAdded(agent: Agent, time: number): void {
    // Read scheduling hints from agent data
    const interval = agent.get("tickInterval") ?? 1;
    const probability = agent.get("tickProbability") ?? 1;
    const offset = agent.get("tickOffset") ?? time;

    this.configs.set(agent, {
      interval: Math.max(1, Math.floor(interval)),
      offset: offset,
      probability: Math.max(0, Math.min(1, probability)),
    });
  }

  onAgentRemoved(agent: Agent): void {
    this.configs.delete(agent);
  }

  reset(): void {
    this.configs.clear();
  }
}

export { DefaultScheduler, AgentScheduleConfig };
