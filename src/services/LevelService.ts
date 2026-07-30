
import { type GuildMember, type Message, type Role } from 'discord.js';
import { UserRepo, type UserRow } from '../db/repositories/UserRepo.js';
import { LevelRewardRepo } from '../db/repositories/LevelRewardRepo.js';
import { XP } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { t } from '../utils/lang.js';

const xpCooldowns = new Map<string, number>();

export function totalXpForLevel(level: number): number {
  if (level <= 0) return 0;
  const L = level;
  const sumN2 = 5 * ((L - 1) * L * (2 * L - 1)) / 6;
  const sumN = 25 * (L - 1) * L;
  const sumK = 100 * L;
  return Math.floor(sumN2 + sumN + sumK);
}

export function levelFromXp(xp: number): number {
  if (xp < totalXpForLevel(1)) return 0;

  let lo = 0;
  let hi = 1000;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (totalXpForLevel(mid) <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function xpForNextLevel(level: number): number {
  return totalXpForLevel(level + 1) - totalXpForLevel(level);
}

function randomXpAmount(): number {

  return XP.PER_MESSAGE_MIN + Math.floor(Math.random() * (XP.PER_MESSAGE_MAX - XP.PER_MESSAGE_MIN + 1));
}

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

    UserRepo.setLevel(userId, newLevel);

    let granted: Role[] = [];
    if (message.member && message.inGuild()) {
  try {
    granted = await applyRoleRewards(message.member, newLevel);
  } catch (err) {

    logger.warn('Role rewards step threw:', err);
  }

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

    getStats(userId: string): { row: UserRow; rank: number; total: number; currentLevelXp: number; nextLevelXp: number } {
    const row = UserRepo.getOrCreate(userId);
    const rank = UserRepo.rankOf(userId);
    const total = UserRepo.countWithXp();
    const currentLevelXp = row.xp - totalXpForLevel(row.level);
    const nextLevelXp = xpForNextLevel(row.level);
    return { row, rank, total, currentLevelXp, nextLevelXp };
  },

    setLevel(userId: string, level: number): void {
    UserRepo.setXpAndLevel(userId, totalXpForLevel(level), level);
  },

    reset(userId: string): void {
    UserRepo.setXpAndLevel(userId, 0, 0);
    xpCooldowns.delete(userId);
  },

    giveXp(userId: string, amount: number): { newXp: number; oldLevel: number; newLevel: number } {
    const before = UserRepo.getOrCreate(userId);
    const newXp = Math.max(0, before.xp + amount);
    const newLevel = levelFromXp(newXp);
    UserRepo.setXpAndLevel(userId, newXp, newLevel);
    return { newXp, oldLevel: before.level, newLevel };
  },
};
