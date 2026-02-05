import type { Agent } from "../agents/Agent";

/**
 * Scheduling entry for an agent.
 */
interface ScheduleEntry {
  agent: Agent;
  time: number;
}

/**
 * Interface for agent schedulers.
 * 
 * A scheduler determines which agents should tick at any given time step.
 * Different implementations allow for different scheduling patterns:
 * - Interval-based (every N ticks)
 * - Priority queue (discrete event simulation)
 * - Custom patterns
 * 
 * @since 0.6.0
 */
interface Scheduler {
  /**
   * Schedule an agent to tick at a specific time.
   * @param agent - The agent to schedule
   * @param time - The time at which the agent should tick
   */
  schedule(agent: Agent, time: number): void;

  /**
   * Remove an agent from the schedule entirely.
   * @param agent - The agent to unschedule
   */
  unschedule(agent: Agent): void;

  /**
   * Get all agents scheduled to tick at the given time.
   * @param time - The current environment time
   * @returns Array of agents that should tick
   */
  getAgentsForTick(time: number): Agent[];

  /**
   * Get the next time at which any agent is scheduled.
   * Used for event-driven simulation to skip empty time steps.
   * @returns The next scheduled time, or null if nothing is scheduled
   */
  nextScheduledTime(): number | null;

  /**
   * Called when an agent is added to the environment.
   * @param agent - The newly added agent
   * @param time - Current environment time
   */
  onAgentAdded(agent: Agent, time: number): void;

  /**
   * Called when an agent is removed from the environment.
   * @param agent - The agent being removed
   */
  onAgentRemoved(agent: Agent): void;

  /**
   * Reset the scheduler state.
   */
  reset(): void;
}

export { Scheduler, ScheduleEntry };
