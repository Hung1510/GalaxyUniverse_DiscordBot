import { type Command } from '../../framework/Command.js';
import { t } from '../../utils/lang.js';

const command: Command = {
  name: 'ping',
  description: 'Kiểm tra bot có online không',
  category: 'user',
  cooldown: 3,

  async execute(ctx) {
    // Send a placeholder, then edit it with the measured latency.
    const sent = await ctx.message.reply('Pinging...');

    const apiLatency = sent.createdTimestamp - ctx.message.createdTimestamp;
    const wsLatency = ctx.client.ws.ping;

    await sent.edit(t('user.ping_pong', { ws: wsLatency, api: apiLatency }));
  },
};

export default command;