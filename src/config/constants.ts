/**
 * Game logic constants — all the numbers we agreed on with the owner.
 *
 * Edit these to tune the bot's economy/level/void behavior. They're plain
 * constants (not config.json) because they're code-level decisions that need
 * to be re-tested when changed, not runtime knobs.
 *
 * `as const` makes TypeScript infer literal types so misuse is caught at
 * compile time. e.g. ECONOMY.DAILY_BASE has type `500`, not `number`.
 */

export const LEVEL = {
  /** Min XP awarded per qualifying message. */
  XP_PER_MESSAGE_MIN: 15,
  /** Max XP awarded per qualifying message. */
  XP_PER_MESSAGE_MAX: 25,
  /** Cooldown between XP awards per user (ms). MEE6/ProBot convention. */
  COOLDOWN_MS: 60_000,
  /** Coefficients for XP-needed-for-level-N curve: 5n² + 50n + 100 (MEE6). */
  CURVE_QUADRATIC: 5,
  CURVE_LINEAR: 50,
  CURVE_CONSTANT: 100,
  /** Coin reward per level-up = (new level) × this. Set to 0 to disable. */
  REWARD_PER_LEVEL: 100,
} as const;

export const ECONOMY = {
  /** Balance new users start with. */
  STARTING_BALANCE: 1000,
  /** Bank cap — protects savings from g!rob. */
  BANK_CAP: 50_000,

  // g!daily
  DAILY_BASE: 500,
  DAILY_STREAK_BONUS: 50,
  DAILY_MAX: 5_000,
  DAILY_COOLDOWN_MS: 24 * 60 * 60 * 1000,
  /** Streak resets if user misses this many days. */
  DAILY_STREAK_GRACE_DAYS: 2,

  // g!work
  WORK_MIN: 200,
  WORK_MAX: 800,
  WORK_COOLDOWN_MS: 60 * 60 * 1000,

  // g!beg
  BEG_MIN: 50,
  BEG_MAX: 200,
  BEG_SUCCESS_RATE: 0.7,
  BEG_COOLDOWN_MS: 30_000,

  // g!pay
  PAY_MIN: 10,
  PAY_COOLDOWN_MS: 5_000,

  // g!rob
  ROB_SUCCESS_RATE: 0.35,
  ROB_STEAL_MIN_PCT: 0.1,
  ROB_STEAL_MAX_PCT: 0.25,
  ROB_FAIL_PENALTY_PCT: 0.2,
  ROB_VICTIM_MIN_BALANCE: 500,
  ROB_COOLDOWN_MS: 4 * 60 * 60 * 1000,
} as const;

export const GAMES = {
  /** Min bet allowed for any betting game. */
  BET_MIN: 50,
  /** Max bet allowed for any betting game (whale prevention). */
  BET_MAX: 5_000,
  /** Generic per-game cooldown (anti-macro). */
  COOLDOWN_MS: 5_000,

  // g!cf — coinflip 50/50
  CF_PAYOUT_MULT: 2,

  // g!dice — guess high/low
  DICE_PAYOUT_MULT: 2,

  // g!slot — 3 reels
  SLOT_THREE_MATCH_MULT: 5,
  SLOT_TWO_MATCH_MULT: 1.5,

  // g!guess — 1..10
  GUESS_RANGE: 10,
  GUESS_PAYOUT_MULT: 8,
  GUESS_COOLDOWN_MS: 30_000,

  // g!quiz
  QUIZ_REWARD: 50,
  QUIZ_ANSWER_WINDOW_MS: 30_000,
  QUIZ_COOLDOWN_MS: 2 * 60 * 1000,
} as const;

export const VOID = {
  /** Min sentence length (number of "glausan" required). */
  MIN_COUNT: 5,
  /** Max sentence length. */
  MAX_COUNT: 50,
  /** Default if mod doesn't specify a count. */
  DEFAULT_COUNT: 10,
  /** The keyword the prisoner must type to make progress. */
  ESCAPE_KEYWORD: 'glausan',
  /** Cooldown between attempts (ms) — prevents copy-paste spam escapes. */
  ATTEMPT_COOLDOWN_MS: 3_000,
  /** Probability that a wrong input resets progress to 0. 0..1. */
  TYPO_RESET_CHANCE: 0.3,
  /** Cooldown after release before user can be re-jailed (anti-griefing). */
  POST_RELEASE_IMMUNITY_MS: 60 * 60 * 1000,
  /** Failsafe: auto-release after this duration even without escape. */
  MAX_SENTENCE_DURATION_MS: 7 * 24 * 60 * 60 * 1000,
} as const;

export const MODERATION = {
  /** Max messages g!clear can delete in one call (Discord bulkDelete cap is 100). */
  CLEAR_MAX: 100,
  /** Discord native timeout cap is 28 days — we expose the same. */
  TIMEOUT_MAX_MS: 28 * 24 * 60 * 60 * 1000,
  /** Auto-escalation thresholds: warn count → action. */
  WARN_THRESHOLDS: [
    { count: 3, action: 'timeout', durationMs: 60 * 60 * 1000 }, // 1h
    { count: 5, action: 'timeout', durationMs: 24 * 60 * 60 * 1000 }, // 24h
    { count: 7, action: 'ban', durationMs: 0 },
  ],
} as const;
