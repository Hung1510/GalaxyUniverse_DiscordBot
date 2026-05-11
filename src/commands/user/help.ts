import { type Command } from '../../framework/Command.js';
import { getAllCommands } from '../../framework/CommandHandler.js';
import { cosmicEmbed } from '../../utils/embed.js';
import { t } from '../../utils/lang.js';
import { env } from '../../config/config.js';

// Display order and Vietnamese labels for each category.
const CATEGORY_ORDER: Array<[string, string]> = [
  ['user', 'Người dùng'],
  ['economy', 'Kinh tế'],
  ['games', 'Game'],
  ['shop', 'Shop & Role'],
  ['moderation', 'Quản lý'],
  ['ticket', 'Hỗ trợ'],
  ['galaxy', 'Galaxy'],
  ['void', 'Void'],
  ['level', 'Level'],
  ['system', 'Hệ thống'],
];

const command: Command = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'Xem danh sách lệnh',
  category: 'user',
  cooldown: 5,

  async execute(ctx) {
    const all = getAllCommands();

    // Group by category in a Map.
    const byCategory = new Map<string, Command[]>();
    for (const cmd of all) {
      const list = byCategory.get(cmd.category) ?? [];
      list.push(cmd);
      byCategory.set(cmd.category, list);
    }

    const embed = cosmicEmbed()
      .setTitle(t('user.help_title'))
      .setFooter({ text: t('user.help_footer', { prefix: env.PREFIX }) });

    // Render categories in defined order first.
    const seen = new Set<string>();
    for (const [key, label] of CATEGORY_ORDER) {
      const cmds = byCategory.get(key);
      if (!cmds || cmds.length === 0) continue;
      seen.add(key);

      const list = cmds
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => `\`${env.PREFIX}${c.name}\``)
        .join(' · ');

      embed.addFields({ name: `${label} (${cmds.length})`, value: list });
    }

    // Catch categories not in CATEGORY_ORDER.
    for (const [key, cmds] of byCategory) {
      if (seen.has(key)) continue;
      const list = cmds.map((c) => `\`${env.PREFIX}${c.name}\``).join(' · ');
      embed.addFields({ name: key, value: list });
    }

    await ctx.message.reply({ embeds: [embed] });
  },
};

export default command;