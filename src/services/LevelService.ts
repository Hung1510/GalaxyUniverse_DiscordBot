/**
 * Level / XP service.
 *
 * Formula: XP needed to go FROM level N to N+1 = 5*N² + 50*N + 100
 *   level 1 = 100 XP (cumulative)
 *   level 5 = 1,150 XP
 *   level 10 = 4,675 XP
 *   level 20 = 23,850 XP
 *   level 50 = 268,375 XP
 *   level 100 = 1,899,250 XP
 *
 * This matches MEE6/ProBot — community members already familiar with it.
 *
 * XP grant rules:
 *   - 15-25 XP per message (random)
 *   - 60s cooldown per user, in-memory (resets on restart — acceptable)
 *   - Bots ignored
 *   - Empty content (just attachments) still counts — typing isn't required
 *   - DM ignored (`messageCreate` handler already filters)
 *
 * Abuse vectors mitigated:
 *   - Spam: cooldown
 *   - Very short messages: no penalty currently. If abused, add min-length later
 *     (don't penalize legit "ok"/"lol" replies for a 350-member chat server)
 *   - XP across alts: not preventable bot-side; that's moderation's job
 */

import { type GuildMember, type Message, type Role } from 'discord.js';
import { UserRepo, type UserRow } from '../db/repositories/UserRepo.js';
import { LevelRewardRepo } from '../db/repositories/LevelRewardRepo.js';
import { XP } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { t } from '../utils/lang.js';

// In-memory cooldown: userId → unix ms of next eligible grant.
// Restart resets — fine because losing one minute of XP isn't meaningful.
const xpCooldowns = new Map<string, number>();

/**
 * MEE6 formula: XP needed to GO FROM level N to level N+1 is 5*N² + 50*N + 100.
 * Total XP to reach level L = sum_{n=0}^{L-1} (5n² + 50n + 100).
 *
 * Closed form sums (we use integer arithmetic to avoid float drift):
 *   sum 5n²        = 5 * (L-1)L(2L-1)/6
 *   sum 50n        = 50 * (L-1)L/2 = 25*(L-1)L
 *   sum 100        = 100 * L
 */
export function totalXpForLevel(level: number): number {
  if (level <= 0) return 0;
  const L = level;
  const sumN2 = 5 * ((L - 1) * L * (2 * L - 1)) / 6;
  const sumN = 25 * (L - 1) * L;
  const sumK = 100 * L;
  return Math.floor(sumN2 + sumN + sumK);
}

/** Given total XP, derive current level. Inverse of totalXpForLevel. */
export function levelFromXp(xp: number): number {
  if (xp < totalXpForLevel(1)) return 0;
  // Binary search rather than iterate from 0 — keeps it O(log L) for high levels.
  let lo = 0;
  let hi = 1000; // cap; unreachable in practice
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (totalXpForLevel(mid) <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** XP needed FROM this level TO the next (just for display in g!rank). */
export function xpForNextLevel(level: number): number {
  return totalXpForLevel(level + 1) - totalXpForLevel(level);
}

function randomXpAmount(): number {
  // Inclusive on both ends.
  return XP.PER_MESSAGE_MIN + Math.floor(Math.random() * (XP.PER_MESSAGE_MAX - XP.PER_MESSAGE_MIN + 1));
}

/**
 * Apply pending role rewards on level-up.
 *
 * Strategy: idempotent — fetch all rewards <= new level, ensure user has all
 * those roles. We don't remove old reward roles when user "passes" them;
 * MEE6 default behavior. (If owner wants tier-replacement later, that's a
 * separate option.)
 *
 * If bot's highest role isn't above the reward role, we log warn and skip
 * — better than throwing a confusing 50013.
 */
async function applyRoleRewards(
  member: GuildMember,
  newLevel: number,
): Promise<Role[]> {
  const rewards = LevelRewardRepo.forLevelUpTo(member.guild.id, newLevel);
  const granted: Role[] = [];

  for (const r of rewards) {
    if (member.roles.cache.has(r.role_id)) continue;
    const role = member.guild.roles.cache.get(r.role_id);
    if (!role) {
      logger.warn(`Level-role reward ${r.role_id} for level ${r.level} no longer exists`);
      continue;
    }
    const me = member.guild.members.me;
    if (!me || me.roles.highest.position <= role.position) {
      logger.warn(`Cannot grant level reward role ${role.name}: bot's highest role isn't above it`);
      continue;
    }
    try {
      await member.roles.add(role, `Level reward: reached level ${newLevel}`);
      granted.push(role);
    } catch (err) {
      logger.warn(`Failed to grant level reward role ${role.name}:`, err);
    }
  }
  return granted;
}

export const LevelService = {
  totalXpForLevel,
  xpForNextLevel,
  levelFromXp,

  /**
   * Called from messageCreate. Returns null if cooldown active (most common path).
   * Returns a result object if XP was granted, with level-up info if relevant.
   */
  async maybeGrantXpFromMessage(
    message: Message,
  ): Promise<{ xpGained: number; leveledUp: boolean; newLevel: number; granted: Role[] } | null> {
    const userId = message.author.id;
    const now = Date.now();

    const nextEligibleAt = xpCooldowns.get(userId) ?? 0;
    if (now < nextEligibleAt) return null;
    xpCooldowns.set(userId, now + XP.COOLDOWN_MS);

    const xpGained = randomXpAmount();
    const before = UserRepo.getOrCreate(userId);
    const afterRow = UserRepo.addXp(userId, xpGained);

    const oldLevel = before.level;
    const newLevel = levelFromXp(afterRow.xp);

    if (newLevel <= oldLevel) {
      return { xpGained, leveledUp: false, newLevel: oldLevel, granted: [] };
    }

    // Level-up. Persist the new level alongside the XP, then handle rewards.
    UserRepo.setLevel(userId, newLevel);

    let granted: Role[] = [];
    if (message.member && message.inGuild()) {
      try {
        granted = await applyRoleRewards(message.member, newLevel);
      } catch (err) {
        // Already logged inside applyRoleRewards; we don't want a role-grant
        // failure to suppress the level-up message.
        logger.warn('Role rewards step threw:', err);
      }

      // Post the level-up message in the same channel (MEE6-style).
      // We don't @mention if the user already has the level role, to avoid spam.
      try {
        const reply = granted.length > 0
          ? t('level.levelup_with_roles', {
              user: `<@${userId}>`,
              level: String(newLevel),
              roles: granted.map((r) => `<@&${r.id}>`).join(', '),
            })
          : t('level.levelup', {
              user: `<@${userId}>`,
              level: String(newLevel),
            });
        await message.channel.send({
          content: reply,
          allowedMentions: { users: [userId], roles: [] },
        });
      } catch (err) {
        logger.warn('Failed to post level-up message:', err);
      }
    }

    return { xpGained, leveledUp: true, newLevel, granted };
  },

  /** Get XP/level/rank for a user — used by g!rank. */
  getStats(userId: string): { row: UserRow; rank: number; total: number; currentLevelXp: number; nextLevelXp: number } {
    const row = UserRepo.getOrCreate(userId);
    const rank = UserRepo.rankOf(userId);
    const total = UserRepo.countWithXp();
    const currentLevelXp = row.xp - totalXpForLevel(row.level);
    const nextLevelXp = xpForNextLevel(row.level);
    return { row, rank, total, currentLevelXp, nextLevelXp };
  },

  /** Admin: set level directly. XP is rebased to the floor of that level. */
  setLevel(userId: string, level: number): void {
    UserRepo.setXpAndLevel(userId, totalXpForLevel(level), level);
  },

  /** Admin: reset everything for one user. */
  reset(userId: string): void {
    UserRepo.setXpAndLevel(userId, 0, 0);
    xpCooldowns.delete(userId);
  },

  /** Admin: directly add (or subtract) XP, recomputing level. */
  giveXp(userId: string, amount: number): { newXp: number; oldLevel: number; newLevel: number } {
    const before = UserRepo.getOrCreate(userId);
    const newXp = Math.max(0, before.xp + amount);
    const newLevel = levelFromXp(newXp);
    UserRepo.setXpAndLevel(userId, newXp, newLevel);
    return { newXp, oldLevel: before.level, newLevel };
  },
};
