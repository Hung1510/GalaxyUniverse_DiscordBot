/**
 * Lightweight metrics (item #17).
 *
 * In-memory only — resets on restart. Good enough for spotting "huh,
 * @user ran g!void 50 times in an hour" patterns.
 *
 * Exposed via g!stats (owner-only) for ad-hoc viewing. For production
 * dashboards, swap this for Prometheus or similar later.
 */

export interface CommandMetric {
  total: number;
  succeeded: number;
  failed: number;
  totalDurationMs: number;
  /** Per-hour buckets, key = unix ms aligned to hour. Last 24 hours kept. */
  hourly: Map<number, number>;
}

const HOUR_MS = 60 * 60 * 1000;
const KEEP_HOURS = 24;

class MetricsStore {
  private commands = new Map<string, CommandMetric>();
  readonly startedAt = Date.now();

  recordCommand(name: string, ok: boolean, durMs: number): void {
    let m = this.commands.get(name);
    if (!m) {
      m = { total: 0, succeeded: 0, failed: 0, totalDurationMs: 0, hourly: new Map() };
      this.commands.set(name, m);
    }
    m.total++;
    if (ok) m.succeeded++; else m.failed++;
    m.totalDurationMs += durMs;

    const hourKey = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
    m.hourly.set(hourKey, (m.hourly.get(hourKey) ?? 0) + 1);

    // Prune old hours
    const cutoff = hourKey - KEEP_HOURS * HOUR_MS;
    for (const k of m.hourly.keys()) {
      if (k < cutoff) m.hourly.delete(k);
    }
  }

  snapshot(): Array<{ name: string; total: number; succeeded: number; failed: number; avgMs: number; last24h: number }> {
    return Array.from(this.commands.entries())
      .map(([name, m]) => {
        let last24h = 0;
        for (const v of m.hourly.values()) last24h += v;
        return {
          name,
          total: m.total,
          succeeded: m.succeeded,
          failed: m.failed,
          avgMs: m.total > 0 ? Math.round(m.totalDurationMs / m.total) : 0,
          last24h,
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  uptimeMs(): number {
    return Date.now() - this.startedAt;
  }
}

export const metrics = new MetricsStore();
