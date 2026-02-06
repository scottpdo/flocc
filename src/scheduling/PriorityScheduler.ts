import type { Agent } from "../agents/Agent";
import type { Scheduler, ScheduleEntry } from "./Scheduler";
import { PriorityQueue } from "../utils/PriorityQueue";

/**
 * A priority queue-based scheduler for discrete event simulation.
 * 
 * Unlike the default interval-based scheduler, the PriorityScheduler
 * allows agents to schedule themselves at arbitrary future times.
 * This enables:
 * - Event-driven simulation (skip empty time steps)
 * - Variable agent timing (fast predators, slow grazers)
 * - Self-scheduling agents (reschedule based on state)
 * 
 * @example
 * ```js
 * const scheduler = new PriorityScheduler();
 * const env = new Environment({ scheduler });
 * 
 * // Agent schedules itself based on energy level
 * agent.set('tick', (a) => {
 *   a.set('energy', a.get('energy') - 10);
 *   
 *   // Schedule next action - lower energy = longer wait
 *   const delay = 100 / a.get('energy');
 *   a.scheduleIn(delay);
 * });
 * 
 * // Run simulation event-by-event
 * while (env.time < 1000) {
 *   env.tickNext(); // Jump to next scheduled event
 * }
 * ```
 * 
 * @since 0.6.0
 */
class PriorityScheduler implements Scheduler {
  private queue: PriorityQueue<ScheduleEntry>;
  private agentEntries: Map<Agent, ScheduleEntry> = new Map();

  constructor() {
    this.queue = new PriorityQueue<ScheduleEntry>((a, b) => a.time - b.time);
  }

  /**
   * Schedule an agent to tick at a specific time.
   * If the agent is already scheduled, the existing entry is replaced.
   */
  schedule(agent: Agent, time: number): void {
    // Remove existing entry if present
    this.unschedule(agent);

    const entry: ScheduleEntry = { agent, time };
    this.queue.insert(entry);
    this.agentEntries.set(agent, entry);
  }

  /**
   * Remove an agent from the schedule.
   */
  unschedule(agent: Agent): void {
    const existing = this.agentEntries.get(agent);
    if (existing) {
      this.queue.remove(existing);
      this.agentEntries.delete(agent);
    }
  }

  /**
   * Get all agents scheduled for exactly the given time.
   * Removes them from the queue (they'll need to reschedule if they want to tick again).
   */
  getAgentsForTick(time: number): Agent[] {
    const result: Agent[] = [];

    // Pop all entries with matching time
    while (this.queue.peek()?.time === time) {
      const entry = this.queue.pop()!;
      this.agentEntries.delete(entry.agent);
      result.push(entry.agent);
    }

    return result;
  }

  /**
   * Get the next scheduled time.
   * Returns null if no agents are scheduled.
   */
  nextScheduledTime(): number | null {
    return this.queue.peek()?.time ?? null;
  }

  /**
   * Check if an agent is currently scheduled.
   */
  isScheduled(agent: Agent): boolean {
    return this.agentEntries.has(agent);
  }

  /**
   * Get the scheduled time for an agent.
   * Returns undefined if the agent is not scheduled.
   */
  getScheduledTime(agent: Agent): number | undefined {
    return this.agentEntries.get(agent)?.time;
  }

  /**
   * Get the number of scheduled entries.
   */
  get size(): number {
    return this.queue.size;
  }

  onAgentAdded(agent: Agent, time: number): void {
    // Check for explicit schedule times
    const tickAt = agent.get("tickAt");
    if (Array.isArray(tickAt) && tickAt.length > 0) {
      // Schedule for the first specified time
      const firstTime = tickAt.find((t: number) => t >= time);
      if (firstTime !== undefined) {
        this.schedule(agent, firstTime);
      }
    } else {
      // Default: schedule for next tick
      this.schedule(agent, time + 1);
    }
  }

  onAgentRemoved(agent: Agent): void {
    this.unschedule(agent);
  }

  reset(): void {
    this.queue.clear();
    this.agentEntries.clear();
  }

  /**
   * Get all scheduled entries (for debugging/inspection).
   * Returns entries sorted by time.
   */
  getSchedule(): Array<{ agent: Agent; time: number }> {
    return this.queue
      .toArray()
      .sort((a, b) => a.time - b.time)
      .map(({ agent, time }) => ({ agent, time }));
  }
}

export { PriorityScheduler };
