/**
 * Permission-tier resolution.
 *
 * Maps a GuildMember to their highest PermissionLevel based on which roles
 * they have (per config.json's modRoleIds / adminRoleIds).
 *
 * Per owner direction: Mod and Admin both get full rights to staff
 * commands. We still expose two tiers because some commands (e.g. setting
 * the Mod role itself) should be Admin-only later. For now the framework
 * supports it; commands choose how strictly to gate.
 */

import type { GuildMember } from 'discord.js';
import { PermissionLevel } from './Command.js';
import { jsonConfig } from '../config/config.js';

export function getPermissionLevel(member: GuildMember): PermissionLevel {
  // Server owner trumps everything — they can recover from any misconfig.
  if (member.guild.ownerId === member.id) return PermissionLevel.ADMIN;

  const roles = member.roles.cache;

  if (jsonConfig.adminRoleIds.some((id) => roles.has(id))) {
    return PermissionLevel.ADMIN;
  }
  if (jsonConfig.modRoleIds.some((id) => roles.has(id))) {
    return PermissionLevel.MOD;
  }
  return PermissionLevel.USER;
}

/** Convenience: does this member meet at least the required tier? */
export function hasPermission(member: GuildMember, required: PermissionLevel): boolean {
  return getPermissionLevel(member) >= required;
}
