
import { config as loadDotenv } from 'dotenv';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

loadDotenv();

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

  BOT_LOG_CHANNEL_ID: z.string().regex(/^\d{17,20}$/).optional(),
});

export type Env = z.infer<typeof envSchema>;

const snowflake = z.string().regex(/^\d{17,20}$/, 'must be a Discord snowflake (17-20 digits)');

const configSchema = z.object({
  prefix: z.string().default('g!'),
  ownerIds: z.array(snowflake).default([]),
  modRoleIds: z.array(snowflake).default([]),
  adminRoleIds: z.array(snowflake).default([]),

  modLogChannelId: snowflake.nullable().optional(),
});

export type Config = z.infer<typeof configSchema>;

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
