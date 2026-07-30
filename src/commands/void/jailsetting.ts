import { type Command, PermissionLevel } from '../../framework/Command.js';
import { VoidService } from '../../services/VoidService.js';
import { GuildSettingsRepo } from '../../db/repositories/GuildSettingsRepo.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'jailsetting',
  description: 'Sync lại quyền Void cho mọi channel',
  category: 'void',
  cooldown: 30,
  permission: PermissionLevel.ADMIN,

  async execute(ctx) {
    const settings = GuildSettingsRepo.get(ctx.guild.id);
    if (!settings?.jail_role_id || !settings.jail_channel_id) {
  await ctx.message.reply({ embeds: [errorEmbed(t('void.setup_first'))] });
  return;
    }
    const working = await ctx.message.reply('🔄 Đang sync perms...');
    const synced = await VoidService.syncJailPermissions(ctx.guild, settings.jail_role_id, settings.jail_channel_id);
    await working.edit({
  content: '',
  embeds: [successEmbed(t('void.sync_done', { n: String(synced) }))],
    });
  },
};

export default command;
