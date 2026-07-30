export class Cooldowns {
  private store = new Map<string, number>();

    check(userId: string, commandName: string, cooldownSec: number): number {
    const key = `${userId}:${commandName}`;
    const expiry = this.store.get(key);
    const now = Date.now();
    if (expiry && expiry > now) {
      return expiry - now;
    }
    this.store.set(key, now + cooldownSec * 1000);
    return 0;
  }

  clear(userId: string, commandName: string): void {
    this.store.delete(`${userId}:${commandName}`);
  }
}

export const cooldowns = new Cooldowns();
