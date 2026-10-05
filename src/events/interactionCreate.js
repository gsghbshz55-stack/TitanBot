import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logger } from '../utils/logger.js';

// آيديات الرومات
const FEEDBACK_CHANNEL_ID = '1391737804781916160';
const TAX_CHANNEL_ID = '1415584488401928292'; // روم الضريبة التلقائي

// مجموعة لحفظ آيديات الرسائل لمنع التكرار
const processedMessages = new Set();

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      if (message.author.bot || !message.guild) return;

      // 1. نظام الضريبة التلقائي (يدعم الأرقام العادية واختصارات مثل k, m, b)
      if (message.channel.id === TAX_CHANNEL_ID) {
        const cleanContent = message.content.trim().toLowerCase();
        let amount = null;

        // التحقق مما إذا كان المدخل رقماً عادياً أو يحتوي على اختصارات (k, m, b)
        const match = cleanContent.match(/^(\d+(?:\.\d+)?)([kmb])?$/);
        
        if (match) {
          const num = parseFloat(match[1]);
          const suffix = match[2];

          if (suffix === 'k') {
            amount = Math.floor(num * 1000);
          } else if (suffix === 'm') {
            amount = Math.floor(num * 1000000);
          } else if (suffix === 'b') {
            amount = Math.floor(num * 1000000000);
          } else if (!suffix) {
            amount = Math.floor(num);
          }
        }

        if (amount !== null && amount > 0) {
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

      // 2. نظام الآراء (Feedback)
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
        content: `** 1414758130361044992 1391735874924052560**`
      }).catch(() => {});

      await channel.setName(newName);
      logger.info(`Ticket renamed successfully to ${newName}`);
    }
  } catch (error) {
    logger.error('Error handling ticket rename:', error);
  }
}
