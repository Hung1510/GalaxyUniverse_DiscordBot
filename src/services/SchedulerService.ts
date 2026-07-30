
import type { Client } from 'discord.js';
import { ScheduledTaskRepo, type ScheduledTaskRow } from '../db/repositories/ScheduledTaskRepo.js';
import { logger } from '../utils/logger.js';

export type TaskHandler = (client: Client<true>, payload: unknown) => Promise<void>;

const handlers = new Map<string, TaskHandler>();
let sweepInterval: NodeJS.Timeout | null = null;

export function registerTaskHandler(taskType: string, handler: TaskHandler): void {
  handlers.set(taskType, handler);
}

async function processTask(client: Client<true>, task: ScheduledTaskRow): Promise<void> {
  const handler = handlers.get(task.task_type);
  if (!handler) {
    logger.warn(`Scheduled task type "${task.task_type}" has no handler — removing.`);
    ScheduledTaskRepo.remove(task.id);
    return;
  }
  try {
    const payload: unknown = JSON.parse(task.payload);
    await handler(client, payload);
  } catch (err) {
    logger.error(`Scheduled task ${task.id} (${task.task_type}) failed:`, err);
  } finally {

    ScheduledTaskRepo.remove(task.id);
  }
}

async function sweep(client: Client<true>): Promise<void> {
  const due = ScheduledTaskRepo.due();
  for (const task of due) {
    await processTask(client, task);
  }
}

export function startScheduler(client: Client<true>, intervalMs = 30_000): void {
  if (sweepInterval) return;

  void sweep(client);
  sweepInterval = setInterval(() => void sweep(client), intervalMs);
  logger.info(`Scheduler started (sweep every ${intervalMs / 1000}s).`);
}

export function stopScheduler(): void {
  if (sweepInterval) {
    clearInterval(sweepInterval);
    sweepInterval = null;
  }
}
