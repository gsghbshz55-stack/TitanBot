import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logger } from '../utils/logger.js';

// آيديات الرومات
const SUGGESTIONS_CHANNEL_ID = '1437792846907183165';
const FEEDBACK_CHANNEL_ID = '1391737804781916160';
const TAX_CHANNEL_ID = '1391737798473678882'; // روم أوامر الضريبة مثل بروبوت

// مجموعة لحفظ آيديات الرسائل لمنع التكرار
const processedMessages = new Set();

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      if (message.author.bot || !message.guild) return;

      const content = message.content.trim();

      // 1. نظام الضريبة (يعمل في الروم المخصص لو كتب العضو الرقم مباشرة أو استخدم -tax أو ك)
      if (message.channel.id === TAX_CHANNEL_ID) {
        let amount = null;

        if (/^\d+$/.test(content)) {
          amount = parseInt(content, 10);
        } else if (content.startsWith('-tax') || content.startsWith('ك')) {
          const args = content.split(/\s+/);
          const numArg = args[1];
          if (numArg && /^\d+$/.test(numArg)) {
            amount = parseInt(numArg, 10);
          }
        }

        if (amount !== null) {
          if (processedMessages.has(message.id)) return;
          processedMessages.add(message.id);
          setTimeout(() => processedMessages.delete(message.id), 60000);

          // حذف رسالة العضو الأصلية
          await message.delete().catch(() => {});

          // حساب الضرائب بدقة
          const taxPro = Math.floor(amount * 20 / 19);
          const mediatorFee = Math.floor(amount * 0.02); // نسبة الوسيط 2%
          const totalWithAll = taxPro + mediatorFee;

          const taxEmbed = new EmbedBuilder()
            .setColor('#ff334b')
            .setAuthor({
              name: message.guild.name,
              iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setDescription(`
• **المبلغ:** \`${amount.toLocaleString()}\`
• **ضريبة بروبوت:** \`${taxPro.toLocaleString()}\`
• **المبلغ كامل مع ضريبة الوسيط:** \`${(taxPro + mediatorFee).toLocaleString()}\`
• **نسبة الوسيط (2%):** \`${mediatorFee.toLocaleString()}\`
• **الضريبة كاملة مع نسبة الوسيط:** \`${totalWithAll.toLocaleString()}\`
            `)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('tax_btn')
              .setLabel('Tax')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('mediator_btn')
              .setLabel('Mediator')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );

          await message.channel.send({
            embeds: [taxEmbed],
            components: [row]
          }).catch((err) => {
            logger.error('Failed to send tax embed:', err);
          });
        }
        return;
      }

      // 2. نظام الاقتراحات التلقائي
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

        const sentMessage = await message.channel.send({
          embeds: [suggestEmbed]
        }).catch((err) => {
          logger.error('Failed to send suggestion embed:', err);
        });

        if (sentMessage) {
          await sentMessage.startThread({
            name: `Discussion - ${message.author.username}`,
            autoArchiveDuration: 1440,
          }).catch(() => {});
        }
        return;
      }

      // 3. نظام الآراء (Feedback)
      if (message.channel.id === FEEDBACK_CHANNEL_ID) {
        const feedbackText = message.content;
        const attachedImage = message.attachments.first() ? message.attachments.first().url : null;
        if (!feedbackText && !attachedImage) return;

        if (processedMessages.has(message.id)) return;
        processedMessages.add(message.id);
        setTimeout(() => processedMessages.delete(message.id), 60000);

        await message.delete().catch(() => {});

        const feedbackEmbed = new EmbedBuilder()
          .setColor('#ff334b')
          .setAuthor({
            name: `ملاحظات المستخدم: ${message.author.username}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
          })
          .setDescription(feedbackText ? `> ${feedbackText}` : '*(مرفق صورة بدون نص)*')
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          .setFooter({ 
            text: `بواسطة: ${message.author.tag}`, 
            iconURL: message.author.displayAvatarURL({ dynamic: true }) 
          })
          .setTimestamp();

        if (attachedImage) {
          feedbackEmbed.setImage(attachedImage);
        }

        await message.channel.send({
          embeds: [feedbackEmbed]
        }).catch((err) => {
          logger.error('Failed to send feedback embed:', err);
        });

        return;
      }

      // 4. نظام تغيير اسم التكت تلقائياً
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
