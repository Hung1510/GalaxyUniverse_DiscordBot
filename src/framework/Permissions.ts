import type { GuildMember } from 'discord.js';
import { PermissionLevel } from './Command.js';
import { config } from '../config/config.js';

export function getPermissionLevel(member: GuildMember): PermissionLevel {
  if (config.ownerIds.includes(member.id)) return PermissionLevel.OWNER;
  if (member.roles.cache.some((r) => config.adminRoleIds.includes(r.id))) {
    return PermissionLevel.ADMIN;
  }
  if (member.roles.cache.some((r) => config.modRoleIds.includes(r.id))) {
    return PermissionLevel.MOD;
  }
  return PermissionLevel.USER;
}

export function hasPermission(member: GuildMember, required: PermissionLevel): boolean {
  return getPermissionLevel(member) >= required;
}
