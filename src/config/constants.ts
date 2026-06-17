/**
 * Gameplay constants — cooldowns, limits, tunables.
 * Edit here, restart bot, takes effect.
 */

export const VOID = {
  /** Cooldown between "glausan" attempts in the jail channel (ms). */
  ATTEMPT_COOLDOWN_MS: 30_000,
  /** Default sentence length (number of glausan typings needed). */
  DEFAULT_COUNT: 10,
  /** Max count an admin can set via g!setvoid. */
  MAX_COUNT: 100,
  /** Period after release where target is immune from being re-jailed (ms). */
  POST_RELEASE_IMMUNITY_MS: 5 * 60_000, // 5 min
} as const;

export const XP = {
  PER_MESSAGE_MIN: 15,
  PER_MESSAGE_MAX: 25,
  COOLDOWN_MS: 60_000,
} as const;
