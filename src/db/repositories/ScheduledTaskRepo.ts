/**
 * DB-backed scheduler. Lets us persist "do X at time Y" across restarts.
 *
 * Why: in-process `setTimeout` dies when the bot restarts. If we ever add
 * time-based void release (e.g. "voided for 10 minutes"), we MUST persist
 * the deadline or restarts leave users jailed forever.
 *
 * Pattern:
 *   1. To schedule: insert a row with task_type, payload (JSON), run_at
 *   2. On startup: sweep all due rows, execute, delete
 *   3. Periodic timer (every 30s) sweeps newly-due rows
 *
 * Wired up in src/services/SchedulerService.ts.
 */

import { db } from '../database.js';

export interface ScheduledTaskRow {
  id: number;
  task_type: string;
  payload: string;
  run_at: number;
  created_at: number;
}

const stmts = {
  insert: db.prepare<[string, string, number, number]>(
    'INSERT INTO scheduled_tasks (task_type, payload, run_at, created_at) VALUES (?, ?, ?, ?)',
  ),
  due: db.prepare<[number], ScheduledTaskRow>(
    'SELECT * FROM scheduled_tasks WHERE run_at <= ? ORDER BY run_at ASC',
  ),
  delete: db.prepare<[number]>('DELETE FROM scheduled_tasks WHERE id = ?'),
  deleteByTypeAndPayload: db.prepare<[string, string]>(
    "DELETE FROM scheduled_tasks WHERE task_type = ? AND payload = ?",
  ),
};

export const ScheduledTaskRepo = {
  schedule(taskType: string, payload: unknown, runAt: number): void {
    stmts.insert.run(taskType, JSON.stringify(payload), runAt, Date.now());
  },
  due(now: number = Date.now()): ScheduledTaskRow[] {
    return stmts.due.all(now);
  },
  remove(id: number): void {
    stmts.delete.run(id);
  },
  cancel(taskType: string, payload: unknown): void {
    stmts.deleteByTypeAndPayload.run(taskType, JSON.stringify(payload));
  },
};
