import { EmbedBuilder, type ColorResolvable } from 'discord.js';

const THEME_COLOR: ColorResolvable = 0x6b2fb3;
const FOOTER_TEXT = 'Galaxy Universe';

export function cosmicEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(THEME_COLOR)
    .setFooter({ text: FOOTER_TEXT })
    .setTimestamp();
}

export function errorEmbed(msg: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setDescription(` ${msg}`);
}

/** Shortcut for success embeds (green). */
export function successEmbed(msg: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setDescription(` ${msg}`);
}
