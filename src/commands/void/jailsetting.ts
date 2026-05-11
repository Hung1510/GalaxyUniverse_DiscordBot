import { type Command, PermissionLevel } from '../../framework/Command.js';
import { VoidService } from '../../services/VoidService.js';
import { GuildSettingsRepo } from '../../db/repositories/GuildSettingsRepo.js';
import { successEmbed, errorEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'jailsetting',
  description: 'Sync lại permission jail cho tất cả channel (chạy sau khi thêm channel mới)',
  category: 'void',
  cooldown: 30,
  permission: PermissionLevel.ADMIN,

  async execute(ctx) {
    const settings = GuildSettingsRepo.get(ctx.guild.id);
    if (!settings?.jail_role_id || !settings.jail_channel_id) {
      await ctx.message.reply({
        embeds: [errorEmbed('Chưa setup Void. Chạy `g!setup jail` trước.')],
      });
      return;
    }

    const working = await ctx.message.reply('🔄 Đang sync permission...');
    const count = await VoidService.syncJailPermissions(
      ctx.guild,
      settings.jail_role_id,
      settings.jail_channel_id,
    );

    await working.edit({
      content: '',
      embeds: [successEmbed(t('void.sync_done', { count }))],
    });
  },
};

export default command;
