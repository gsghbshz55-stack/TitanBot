import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logger } from '../utils/logger.js';

// آيدي روم الاقتراحات
const SUGGESTIONS_CHANNEL_ID = '1437792846907183165';

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      if (message.author.bot || !message.guild) return;

      // 1. تشغيل نظام الاقتراحات التلقائي إذا كانت الرسالة في روم الاقتراحات
      if (message.channel.id === SUGGESTIONS_CHANNEL_ID) {
        const suggestionText = message.content;
        if (!suggestionText) return;

        // حذف رسالة العضو الأصلية لكي يظهر الاقتراح منظماً بتوقيع البوت
        await message.delete().catch(() => {});

        // تصميم إمبد الاقتراح
        const suggestEmbed = new EmbedBuilder()
          .setAuthor({
            name: `Suggested by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
          })
          .setDescription(suggestionText)
          .setColor('#2b2d31');

        // أزرار التصويت (لايك ودسلايك بأعداد تبدأ من الصفر)
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

        // إرسال الاقتراح في الروم
        const sentMessage = await message.channel.send({
          embeds: [suggestEmbed],
          components: [buttons]
        });

        // فتح ثريد (مناقشة) تحت الاقتراح تلقائياً
        await sentMessage.startThread({
          name: `Discussion - ${message.author.username}`,
          autoArchiveDuration: 1440,
        }).catch(() => {});

        return; // إنهاء التنفيذ هنا حتى لا يتداخل مع التكتات
      }

      // 2. تشغيل نظام تغيير اسم التكت تلقائياً
      await handleTicketAutoRename(message);

    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  },
};

// دالة تغيير اسم التكت التلقائية
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
