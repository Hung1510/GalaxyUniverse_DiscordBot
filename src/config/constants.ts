
export const VOID = {
    ATTEMPT_COOLDOWN_MS: 30_000,
    DEFAULT_COUNT: 10,
    MAX_COUNT: 100,
    POST_RELEASE_IMMUNITY_MS: 5 * 60_000,
} as const;

export const XP = {
  PER_MESSAGE_MIN: 15,
  PER_MESSAGE_MAX: 25,
  COOLDOWN_MS: 60_000,
} as const;
