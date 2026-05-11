const cooldowns = new Map<string, number>();

function key(userId: string, commandName: string): string {
  return `${userId}:${commandName}`;
}

/*Check if user is on cooldown. Returns remaining seconds, or 0 if free.*/
export function getRemaining(userId: string, commandName: string): number {
  const expires = cooldowns.get(key(userId, commandName));
  if (!expires) return 0;
  const remaining = expires - Date.now();
  if (remaining <= 0) {
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

/** Manually clear */
export function clear(userId: string, commandName: string): void {
  cooldowns.delete(key(userId, commandName));
}
