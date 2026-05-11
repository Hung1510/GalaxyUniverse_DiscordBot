import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface EnvConfig {
  DISCORD_TOKEN: string;
  DATABASE_PATH: string;
  PREFIX: string;
  NODE_ENV: 'development' | 'production';
}

function loadEnv(): EnvConfig {
  const required = ['DISCORD_TOKEN'] as const;
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`Missing required env var: ${key}`);
      console.error('  Copy .env.example to .env and fill it in.');
      process.exit(1);
    }
  }

  return {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
    DATABASE_PATH: process.env.DATABASE_PATH ?? './data/galaxy.db',
    PREFIX: process.env.PREFIX ?? 'g!',
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) ?? 'development',
  };
}


export interface JsonConfig {
  /** Role IDs that grant Mod-level permissions. */
  modRoleIds: string[];
  /** Role IDs that grant Admin-level permissions. */
  adminRoleIds: string[];
  /** Channel where moderation actions are logged. Empty string = not configured. */
  modLogChannelId: string;
  /** Category under which ticket channels are created. */
  ticketCategoryId: string;
  /** Channel where ticket transcripts are posted on close. */
  transcriptsChannelId: string;
  /** Channel for new-member welcome messages. */
  welcomeChannelId: string;
}

function loadJsonConfig(): JsonConfig {
  const configPath = resolve(__dirname, 'config.json');
  const examplePath = resolve(__dirname, 'config.example.json');

  let pathToUse: string;
  if (existsSync(configPath)) {
    pathToUse = configPath;
  } else if (existsSync(examplePath)) {
    console.warn('config.json not found, using config.example.json');
    console.warn('   Many features (mod log, tickets) will be disabled.');
    pathToUse = examplePath;
  } else {
    console.error(' Neither config.json nor config.example.json found');
    process.exit(1);
  }

  try {
    const raw = readFileSync(pathToUse, 'utf8');
    const parsed = JSON.parse(raw) as JsonConfig;

    // Sanity-check the shape
    if (!Array.isArray(parsed.modRoleIds) || !Array.isArray(parsed.adminRoleIds)) {
      throw new Error('modRoleIds and adminRoleIds must be arrays');
    }

    return parsed;
  } catch (err) {
    console.error(`Failed to load config from ${pathToUse}:`, err);
    process.exit(1);
  }
}


export const env = loadEnv();
export const jsonConfig = loadJsonConfig();
