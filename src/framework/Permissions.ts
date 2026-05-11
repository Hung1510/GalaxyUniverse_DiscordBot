import type { GuildMember } from 'discord.js';
import { PermissionLevel } from './Command.js';
import { jsonConfig } from '../config/config.js';

export function getPermissionLevel(member: GuildMember): PermissionLevel {
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

export function hasPermission(member: GuildMember, required: PermissionLevel): boolean {
  return getPermissionLevel(member) >= required;
}
