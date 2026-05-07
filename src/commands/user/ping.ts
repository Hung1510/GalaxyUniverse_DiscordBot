/**
 * g!ping — checks bot is alive and shows two latencies:
 *   - WebSocket: round-trip to Discord's gateway
 *   - API:       time for our reply to be sent (round-trip via Discord REST)
 *
 * If WebSocket is huge or API is huge, you've got network/Discord issues.
 * If both look normal, the bot itself is healthy.
 */

import { type Command } from '../../framework/Command.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'ping',
  description: 'Kiểm tra bot có online không',
  category: 'user',
  cooldown: 3,

  async execute(ctx) {
    // Send a placeholder, then edit it with the measured latency.
    // editing.createdTimestamp - sent.createdTimestamp gives API round-trip.
    const sent = await ctx.message.reply('🏓 Pinging...');

    const apiLatency = sent.createdTimestamp - ctx.message.createdTimestamp;
    const wsLatency = ctx.client.ws.ping;

    await sent.edit(t('user.ping_pong', { ws: wsLatency, api: apiLatency }));
  },
};

export default command;
