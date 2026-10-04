import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logger } from '../utils/logger.js';

// آيدي روم الاقتراحات
const SUGGESTIONS_CHANNEL_ID = '1437792846907183165';

// آيدي روم الآراء (Feedback) الأساسي الذي حددته
const FEEDBACK_CHANNEL_ID = '1391737804781916160';

// مجموعة لحفظ آيديات الرسائل لمنع التكرار
const processedMessages = new Set();

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      if (message.author.bot || !message.guild) return;

      // 1. نظام الاقتراحات التلقائي
      if (message.channel.id === SUGGESTIONS_CHANNEL_ID) {
        const suggestionText = message.content;
        if (!suggestionText) return;

        if (processedMessages.has(message.id)) return;
        processedMessages.add(message.id);
        setTimeout(() => processedMessages.delete(message.id), 60000);

        await message.delete().catch(() => {});

        const lineGifUrl = 'https://cdn.discordapp.com/attachments/1391737614926614588/1555914383253708850/standard-1.gif?backend=b2&ex=6ac39330&is=6ac241b0&hm=a59fa9266ef864e2fbf9d7f6b1d369c6fb4381d859482fab5f15a31dbf48187d&';

        const suggestEmbed = new EmbedBuilder()
          .setAuthor({
            name: `Suggested by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
          })
          .setDescription(suggestionText)
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          .setImage(lineGifUrl)
          .setColor('#2b2d31');

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('suggest_up')
            .setLabel('0')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👍'),
          new ButtonBuilder()
            .setCustomId('suggest_down')
            .setLabel('0')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👎')
        );

        const sentMessage = await message.channel.send({
          embeds: [suggestEmbed],
          components: [buttons]
        }).catch((err) => {
          logger.error('Failed to send suggestion embed:', err);
        });

        if (sentMessage) {
          await sentMessage.startThread({
            name: `Discussion - ${message.author.username}`,
            autoArchiveDuration: 1440,
          }).catch((err) => {
            logger.error('Failed to create suggestion thread:', err);
          });
        }
        return;
      }

      // 2. نظام الآراء (Feedback) التلقائي
      if (message.channel.id === FEEDBACK_CHANNEL_ID) {
        const feedbackText = message.content;
        const attachedImage = message.attachments.first() ? message.attachments.first().url : null;
        if (!feedbackText && !attachedImage) return;

        if (processedMessages.has(message.id)) return;
        processedMessages.add(message.id);
        setTimeout(() => processedMessages.delete(message.id), 60000);

        // حذف رسالة العضو الأصلية
        await message.delete().catch(() => {});

        // تصميم إمبد الفيدباك
        const feedbackEmbed = new EmbedBuilder()
          .setColor('#2b2d31')
          .setAuthor({
            name: `Feedback by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
          })
          .setDescription(feedbackText ? `\`\`\`${feedbackText}\`\`\`` : '`[No text provided]`')
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

        if (attachedImage) {
          feedbackEmbed.setImage(attachedImage);
        }

        // إرسال الفيدباك
        const sentFeedback = await message.channel.send({
          embeds: [feedbackEmbed]
        }).catch((err) => {
          logger.error('Failed to send feedback embed:', err);
        });

        if (sentFeedback) {
          // إضافة الإيموجيات المخصصة الخاصة بالسيرفر
          await sentFeedback.react('1556300724340523091').catch(() => {});
          await sentFeedback.react('1556300789125873677').catch(() => {});
        }
        return;
      }

      // 3. نظام تغيير اسم التكت تلقائياً
      await handleTicketAutoRename(message);

    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  },
};

async function handleTicketAutoRename(message) {
  try {
    const channel = message.channel;
    if (!channel.name.toLowerCase().startsWith('ticket-')) return;

    const parts = channel.name.split('-');
    if (parts.length > 2) return; 

    const firstWord = message.content.trim().split(/\s+/)[0];
    if (!firstWord) return;

    const cleanWord = firstWord.replace(/[^\w\u0600-\u06FF-]/g, '');

    if (cleanWord.length > 0) {
      const ticketNumberMatch = channel.name.match(/\d+/);
      const ticketNumber = ticketNumberMatch ? ticketNumberMatch[0] : '0000';
      const newName = `${ticketNumber}-${cleanWord}`;

      await channel.send({
        content: `**مرحباً بك، سيتم تغيير اسم التكت بناءً على رسالتك لتسهيل الدعم الفني. شكراً لك!🤍**`
      }).catch(() => {});

      await channel.setName(newName);
      logger.info(`Ticket renamed successfully to ${newName}`);
    }
  } catch (error) {
    logger.error('Error handling ticket rename:', error);
  }
}
