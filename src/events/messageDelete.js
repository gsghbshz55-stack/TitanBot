import { Events, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';

// آيدي روم الاقتراحات
const SUGGESTIONS_CHANNEL_ID = '1437792846907183165';

// آيدي روم الآراء (Feedback)
const FEEDBACK_CHANNEL_ID = '1391737804781916160';

// مجموعة لحفظ آيديات الرسائل لمنع التكرار
const processedMessages = new Set();

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      if (message.author.bot || !message.guild) return;

      // 1. نظام الاقتراحات التلقائي (كما هو بدون تغيير)
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

        // (تم اختصار كود الاقتراحات ليوضع كاملاً كما كان في ملفك)
        return;
      }

      // 2. نظام الآراء (Feedback) الجديد كلياً بلون أحمر وتصميم مميز
      if (message.channel.id === FEEDBACK_CHANNEL_ID) {
        const feedbackText = message.content;
        const attachedImage = message.attachments.first() ? message.attachments.first().url : null;
        if (!feedbackText && !attachedImage) return;

        if (processedMessages.has(message.id)) return;
        processedMessages.add(message.id);
        setTimeout(() => processedMessages.delete(message.id), 60000);

        // حذف رسالة العضو الأصلية
        await message.delete().catch(() => {});

        // تصميم إمبد الفيدباك (بلون أحمر وتصميم جديد)
        const feedbackEmbed = new EmbedBuilder()
          .setColor('#ff334b') // لون أحمر مميز
          .setAuthor({
            name: `New Feedback | ${message.author.username}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
          })
          .setDescription(feedbackText ? `💬 **الرأي:**\n${feedbackText}` : '💬 **الرأي:** `[مرفق صورة بدون نص]`')
          .setFooter({ 
            text: `Requested by ${message.author.tag}`, 
            iconURL: message.author.displayAvatarURL({ dynamic: true }) 
          })
          .setTimestamp();

        if (attachedImage) {
          feedbackEmbed.setImage(attachedImage);
        }

        // إرسال الإيموجيات المخصصة فوق أو مع الإرسال
        const sentFeedback = await message.channel.send({
          content: `<:emoji_1:${'1556300724340523091'}> <:emoji_2:${'1556300789125873677'}> **• تقييم جديد تم إضافته:**`,
          embeds: [feedbackEmbed]
        }).catch((err) => {
          logger.error('Failed to send feedback embed:', err);
        });

        if (sentFeedback) {
          // تفاعلات تحت الإمبد أيضاً للإضافة
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
