/**
 * In-memory cooldown tracker.
 *
 * Storage: Map<key, expiresAtMs> where key = `${userId}:${commandName}`.
 *
 * Why not DB:
 * - Cooldowns are short (seconds to minutes); checked on every command call
 * - DB hit per command would add latency and DB load
 * - Losing them on restart is fine — at worst, users get one free use
 *
 * Long cooldowns (g!daily 24h, g!work 1h) are persisted in the users
 * table separately. This map is ONLY for short, transient anti-spam.
 */

const cooldowns = new Map<string, number>();

function key(userId: string, commandName: string): string {
  return `${userId}:${commandName}`;
}

/**
 * Check if user is on cooldown. Returns remaining seconds, or 0 if free.
 */
export function getRemaining(userId: string, commandName: string): number {
  const expires = cooldowns.get(key(userId, commandName));
  if (!expires) return 0;
  const remaining = expires - Date.now();
  if (remaining <= 0) {
    // Lazy cleanup — only when we'd return 0 anyway. Avoids a separate sweep.
    cooldowns.delete(key(userId, commandName));
    return 0;
  }
  return Math.ceil(remaining / 1000);
}

/** Mark this user as having just used this command. Sets cooldown for `seconds` ahead. */
export function set(userId: string, commandName: string, seconds: number): void {
  if (seconds <= 0) return;
  cooldowns.set(key(userId, commandName), Date.now() + seconds * 1000);
}

/** Manually clear (e.g. on command failure, you might want to refund the cooldown). */
export function clear(userId: string, commandName: string): void {
  cooldowns.delete(key(userId, commandName));
}
