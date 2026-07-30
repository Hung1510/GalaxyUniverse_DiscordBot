
import { type Command, PermissionLevel } from '../../framework/Command.js';
import { cosmicEmbed, successEmbed, errorEmbed } from '../../utils/embed.js';
import { LevelRewardRepo } from '../../db/repositories/LevelRewardRepo.js';
import { t } from '../../utils/lang.js';

const MAX_LEVEL = 200;

const command: Command = {
  name: 'levelrole',
  aliases: ['lvlrole'],
  description: 'Quản lý role thưởng theo level (admin)',
  usage: 'levelrole <add|remove|list> ...',
  category: 'level',
  cooldown: 5,
  permission: PermissionLevel.ADMIN,

  async execute(ctx) {
    const sub = ctx.args[0]?.toLowerCase();

    if (sub === 'list') {
      const rewards = LevelRewardRepo.list(ctx.guild.id);
      const embed = cosmicEmbed().setTitle('🎁 Level role rewards');
      if (rewards.length === 0) {
        embed.setDescription(t('level.no_rewards'));
      } else {
        embed.setDescription(rewards.map((r) => `Level **${r.level}** → <@&${r.role_id}>`).join('\n'));
      }
      await ctx.message.reply({ embeds: [embed] });
      return;
    }

    if (sub === 'add') {
      const levelArg = ctx.args[1];
      const roleMention = ctx.message.mentions.roles.first() ?? ctx.guild.roles.cache.get(ctx.args[2] ?? '');

      if (!levelArg || !roleMention) {
        await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_args', { usage: 'g!levelrole add <level> @role' }))] });
        return;
      }

      const level = parseInt(levelArg, 10);
      if (isNaN(level) || level < 1 || level > MAX_LEVEL) {
        await ctx.message.reply({ embeds: [errorEmbed(t('level.invalid_level', { max: String(MAX_LEVEL) }))] });
        return;
      }

      if (roleMention.id === ctx.guild.id) {
        await ctx.message.reply({ embeds: [errorEmbed(t('level.role_everyone'))] });
        return;
      }

      if (roleMention.managed) {
        await ctx.message.reply({ embeds: [errorEmbed(t('level.role_managed'))] });
        return;
      }

      const me = ctx.guild.members.me;
      if (!me || me.roles.highest.position <= roleMention.position) {
        await ctx.message.reply({
          embeds: [errorEmbed(t('level.role_too_high', { role: roleMention.name }))],
        });
        return;
      }

      LevelRewardRepo.set(ctx.guild.id, level, roleMention.id);
      await ctx.message.reply({
        embeds: [successEmbed(t('level.reward_set', {
          level: String(level),
          role: `<@&${roleMention.id}>`,
        }))],
      });
      return;
    }

    if (sub === 'remove' || sub === 'rm' || sub === 'delete') {
      const levelArg = ctx.args[1];
      if (!levelArg) {
        await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_args', { usage: 'g!levelrole remove <level>' }))] });
        return;
      }
      const level = parseInt(levelArg, 10);
      if (isNaN(level)) {
        await ctx.message.reply({ embeds: [errorEmbed(t('level.invalid_level', { max: String(MAX_LEVEL) }))] });
        return;
      }
      const removed = LevelRewardRepo.remove(ctx.guild.id, level);
      if (!removed) {
        await ctx.message.reply({ embeds: [errorEmbed(t('level.reward_not_found', { level: String(level) }))] });
        return;
      }
      await ctx.message.reply({
        embeds: [successEmbed(t('level.reward_removed', { level: String(level) }))],
      });
      return;
    }

    await ctx.message.reply({
      embeds: [errorEmbed(t('common.invalid_args', { usage: 'g!levelrole <add|remove|list> ...' }))],
    });
  },
};

export default command;
