import { type Command, PermissionLevel } from '../../framework/Command.js';
import { VoidService } from '../../services/VoidService.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'setup',
  description: 'Setup tính năng (vd: g!setup jail)',
  usage: 'setup jail',
  category: 'void',
  cooldown: 10,
  permission: PermissionLevel.ADMIN,

  async execute(ctx) {
    const sub = ctx.args[0]?.toLowerCase();
    if (sub !== 'jail') {
  await ctx.message.reply({ embeds: [errorEmbed(t('common.invalid_args', { usage: 'g!setup jail' }))] });
  return;
    }

    const working = await ctx.message.reply('🛠️ Đang setup Void, đợi xíu...');
    const result = await VoidService.setup(ctx.guild);

    if (!result.ok) {
  if (result.reason === 'already_setup') {
    await working.edit({ content: '', embeds: [errorEmbed(t('void.setup_already'))] });
    return;
  }
  if (result.reason === 'missing_perms') {
    await working.edit({
  content: '',
  embeds: [errorEmbed(t('void.setup_missing_perms', { perms: result.missing?.join(', ') ?? '?' }))],
    });
    return;
  }
  return;
    }

    await working.edit({
  content: '',
  embeds: [successEmbed(t('void.setup_done', {
    role: `<@&${result.roleId}>`,
    channel: `<#${result.channelId}>`,
    n: String(result.channelsSynced),
  }))],
    });
  },
};

export default command;
