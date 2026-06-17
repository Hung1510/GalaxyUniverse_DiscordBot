/**
 * Config loader with strict validation (item #4 — fail loud on startup).
 *
 * Two sources:
 *   1. .env file (secrets — never commit): DISCORD_TOKEN, DATABASE_PATH, etc.
 *   2. config.json (committed): role IDs, channel IDs, owner IDs
 *
 * Both are validated with Zod at startup. If anything's missing or
 * malformed, the bot crashes immediately with a clear error — much better
 * than crashing 10 minutes later when someone runs a command.
 *
 * Why Zod over manual checks: it gives you type-safe parsed output for
 * free, so `env.DISCORD_TOKEN` is `string` (not `string | undefined`)
 * everywhere downstream.
 */

import { config as loadDotenv } from 'dotenv';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

loadDotenv();

// ────────────────────────────────────────────────────────────────────────────
// .env schema
// ────────────────────────────────────────────────────────────────────────────

const envSchema = z.object({
  DISCORD_TOKEN: z
    .string()
    .min(50, 'DISCORD_TOKEN looks too short (need >=50 chars)')
    .refine(
      (t) => t.split('.').length === 3,
      'DISCORD_TOKEN should have 3 dot-separated parts (xxx.yyy.zzz)',
    ),
  DATABASE_PATH: z.string().default('data/galaxy.db'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  // Optional: mod-log channel for global bot events (deploy notification, errors)
  BOT_LOG_CHANNEL_ID: z.string().regex(/^\d{17,20}$/).optional(),
});

export type Env = z.infer<typeof envSchema>;

// ────────────────────────────────────────────────────────────────────────────
// config.json schema
// ────────────────────────────────────────────────────────────────────────────

const snowflake = z.string().regex(/^\d{17,20}$/, 'must be a Discord snowflake (17-20 digits)');

const configSchema = z.object({
  prefix: z.string().default('g!'),
  ownerIds: z.array(snowflake).default([]),
  modRoleIds: z.array(snowflake).default([]),
  adminRoleIds: z.array(snowflake).default([]),
  // Mod-log channel — every Void action (and later: warns, bans, etc.) posts here.
  // Accept null (explicit "not set" in JSON) OR missing (undefined).
  modLogChannelId: snowflake.nullable().optional(),
});

export type Config = z.infer<typeof configSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Parse + validate, crash on failure
// ────────────────────────────────────────────────────────────────────────────

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    logger.error('Invalid .env configuration:');
    for (const issue of result.error.issues) {
      logger.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    logger.error('Fix your .env file and restart. See .env.example for reference.');
    process.exit(1);
  }
  return result.data;
}

function parseConfig(): Config {
  const configPath = resolve(process.cwd(), 'config.json');
  if (!existsSync(configPath)) {
    logger.error(`config.json not found at ${configPath}`);
    logger.error('Copy config.example.json to config.json and fill in your IDs.');
    process.exit(1);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (err) {
    logger.error('config.json is not valid JSON:', err);
    process.exit(1);
  }

  const result = configSchema.safeParse(raw);
  if (!result.success) {
    logger.error('Invalid config.json:');
    for (const issue of result.error.issues) {
      logger.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env: Env = parseEnv();
export const config: Config = parseConfig();

logger.info(`Config loaded. Prefix: ${config.prefix}, Owners: ${config.ownerIds.length}, Mods: ${config.modRoleIds.length}, Admins: ${config.adminRoleIds.length}`);
