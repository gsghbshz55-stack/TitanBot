import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const processedMessages = new Set();

const ALLOWED_ROLES = [
  '1414751141706731691',
];

const SUGGESTION_CHANNEL_ID = '1437792846907183165';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // فحص للتأكد هل البوت دخل روم الاقتراحات أم لا
    if (message.channel.id === SUGGESTION_CHANNEL_ID) {
      console.log(`[Suggestion System] تم استلام رسالة في روم الاقتراحات من: ${message.author.tag}`);
      
      const suggestionText = message.content;
      const attachedImage = message.attachments.first() ? message.attachments.first().url : message.author.displayAvatarURL({ dynamic: true });

      try {
        await message.delete();

        const embed = new EmbedBuilder()
          .setColor('#2b2d31')
          .setAuthor({
            name: `Suggested by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
          })
          .setDescription(`\`\`\`${suggestionText}\`\`\``)
          .setThumbnail(attachedImage);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('suggestion_upvote')
            .setLabel('0')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji({ id: '1556268829879836793' }),
          new ButtonBuilder()
            .setCustomId('suggestion_downvote')
            .setLabel('0')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji({ id: '1556268829879836793' })
        );

        const sentMessage = await message.channel.send({
          embeds: [embed],
          components: [row]
        });

        await sentMessage.startThread({
          name: `Discussion - ${message.author.username}`,
          autoArchiveDuration: 1440
        });

      } catch (error) {
        console.error('حدث خطأ أثناء معالجة الاقتراح:', error);
      }
      return;
    }

    // باقي الأوامر الإدارية...
    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);
    setTimeout(() => processedMessages.delete(message.id), 5000);

    const content = message.content.trim();
    const args = content.split(/\s+/);
    const command = args[0].toLowerCase();

    if (command === 'ip') {
      await message.reply('144.217.62.159:7777').catch(() => {});
      return;
    } else if (command === 'fayt') {
      await message.reply('pr.sampdroid.app:7777').catch(() => {});
      return;
    }

    const hasAllowedRole = message.member?.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));
    if (!hasAllowedRole) return;

    if (command === 'رابط') {
      await message.reply('𝐃𝐙  𝐓𝐎𝐏  | 𝐌𝐎𝐃𝐒  2𝐊\nhttps://discord.gg/CdGddfWQZq').catch(() => {});
      return;
    } else if (command === 'خط') {
      await message.reply('https://cdn.discordapp.com/attachments/1391737614926614588/1555914383253708850/standard-1.gif?backend=b2&ex=6ac2ea70&is=6ac198f0&hm=15533f388cc6ffddc683615e6f416376bd0bd16b83a7ec36e905c0037bc320d7&').catch(() => {});
      return;
    }
  }
};
