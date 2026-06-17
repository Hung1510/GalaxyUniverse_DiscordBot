import { type Command, PermissionLevel } from '../../framework/Command.js';
import { cosmicEmbed, errorEmbed } from '../../utils/embed.js';
import { getAllCommands } from '../../framework/CommandHandler.js';
import { config } from '../../config/config.js';
import { hasPermission } from '../../framework/Permissions.js';

const categoryLabels: Record<string, string> = {
  user: 'Người dùng',
  void: 'Void',
  level: 'Level',
  system: 'Hệ thống',
};

const command: Command = {
  name: 'help',
  aliases: ['h'],
  description: 'Hiển thị danh sách lệnh',
  usage: 'help [tên lệnh]',
  category: 'user',
  cooldown: 5,
  permission: PermissionLevel.USER,

  async execute(ctx) {
    const all = getAllCommands();
    const target = ctx.args[0]?.toLowerCase();

    if (target) {
      const cmd = all.get(target);
      if (!cmd || cmd.hidden) {
        await ctx.message.reply({ embeds: [errorEmbed(`Không có lệnh \`${target}\`.`)] });
        return;
      }
      const embed = cosmicEmbed()
        .setTitle(`📖 ${config.prefix}${cmd.name}`)
        .setDescription(cmd.description);
      if (cmd.usage) embed.addFields({ name: 'Cách dùng', value: `\`${config.prefix}${cmd.usage}\`` });
      if (cmd.aliases?.length) embed.addFields({ name: 'Alias', value: cmd.aliases.map((a) => `\`${a}\``).join(', ') });
      embed.addFields(
        { name: 'Cooldown', value: `${cmd.cooldown ?? 0}s`, inline: true },
        { name: 'Quyền', value: ['User', 'Mod', 'Admin', 'Owner'][cmd.permission ?? 0]!, inline: true },
      );
      await ctx.message.reply({ embeds: [embed] });
      return;
    }

    // List view — group by category, show only commands user can run
    const byCategory = new Map<string, Command[]>();
    for (const cmd of all.values()) {
      if (cmd.hidden) continue;
      if (!hasPermission(ctx.member, cmd.permission ?? PermissionLevel.USER)) continue;
      const list = byCategory.get(cmd.category) ?? [];
      list.push(cmd);
      byCategory.set(cmd.category, list);
    }

    const embed = cosmicEmbed().setTitle('🌌 Galaxy Universe — Danh sách lệnh');
    for (const [cat, cmds] of byCategory) {
      const label = categoryLabels[cat] ?? cat;
      embed.addFields({
        name: `${label} (${cmds.length})`,
        value: cmds.map((c) => `\`${config.prefix}${c.name}\``).join(' · '),
      });
    }
    embed.setFooter({ text: `Prefix: ${config.prefix} · Gõ ${config.prefix}help <lệnh> để xem chi tiết` });
    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;
