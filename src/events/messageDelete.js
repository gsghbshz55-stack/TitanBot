import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logger } from '../utils/logger.js';

// آيدي روم الاقتراحات
const SUGGESTIONS_CHANNEL_ID = '1437792846907183165';

// آيدي روم الضريبة المحدد (اختياري، اتركه فارغاً '' لو تريده يعمل في كل الرومات، أو ضع آيدي الروم هنا)
const TAX_CHANNEL_ID = '1415584488401928292';

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      if (message.author.bot || !message.guild) return;

      const content = message.content ? message.content.trim() : '';
      const args = content.split(/\s+/);
      const command = args[0].toLowerCase();

      // ==========================================
      // 1. نظام حساب الضريبة (Tax) مع دعم k و m
      // ==========================================
      if (command === 'tax' || command === 'ضريبة') {
        // إذا أردت تقييد أمر الضريبة بروم معين، قم بإلغاء التفعيل للشرط التالي
        if (TAX_CHANNEL_ID && message.channel.id !== TAX_CHANNEL_ID) return;

        const input = args[1];
        if (!input) {
          return message.reply('❌ يرجى كتابة المبلغ المراد حساب ضريبته (مثال: `tax 100k` أو `tax 1m`).').catch(() => {});
        }

        let amount = parseTaxInput(input);
        if (isNaN(amount) || amount <= 0) {
          return message.reply('❌ يرجى كتابة رقم صحيح أو استخدام اختصارات صحيحة (مثل: `100k`, `1.5m`, `5000`).').catch(() => {});
        }

        // الحسابات والنسب تماماً مثل الصورة
        const botTax = Math.ceil(amount * 20 / 19); // ضريبة بروبوت
        const mediatorPercentage = 2; // نسبة الوسيط 2%
        const mediatorFee = Math.ceil(amount * (mediatorPercentage / 100));
        const totalWithMediator = amount + mediatorFee;
        const fullTaxWithMediator = Math.ceil(totalWithMediator * 20 / 19);

        // تنسيق الناتج بنفس شكل الصورة بالضبط
        const resultText = `> * المبلغ: **${formatNumber(amount)}**\n> * ضريبة بروبوت: **${formatNumber(botTax)}**\n> * المبلغ كامل مع ضريبة الوسيط: **${formatNumber(totalWithMediator)}**\n> * نسبة الوسيط %2: **${formatNumber(mediatorFee)}**\n> * الضريبة كاملة مع نسبة الوسيط: **${formatNumber(fullTaxWithMediator)}**`;

        return message.reply(resultText).catch(() => {});
      }

      // ==========================================
      // 2. نظام الاقتراحات التلقائي
      // ==========================================
      if (message.channel.id === SUGGESTIONS_CHANNEL_ID) {
        const suggestionText = message.content;
        if (!suggestionText) return;

        // حذف رسالة العضو الأصلية
        await message.delete().catch(() => {});

        // رابط الخط المتحرك
        const lineGifUrl = 'https://cdn.discordapp.com/attachments/1391737614926614588/1555914383253708850/standard-1.gif?backend=b2&ex=6ac39330&is=6ac241b0&hm=a59fa9266ef864e2fbf9d7f6b1d369c6fb4381d859482fab5f15a31dbf48187d&';

        // تصميم إمبد الاقتراح المطلوب مع الخط وصورة الشخص
        const suggestEmbed = new EmbedBuilder()
          .setAuthor({
            name: `Suggested by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true })
          })
          .setDescription(suggestionText)
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
          .setImage(lineGifUrl)
          .setColor('#2b2d31');

        // أزرار التصويت
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

        // إرسال الإمبد مرة واحدة فقط وبشكل نهائي
        const sentMessage = await message.channel.send({
          embeds: [suggestEmbed],
          components: [buttons]
        }).catch((err) => {
          logger.error('Failed to send suggestion embed:', err);
        });

        if (sentMessage) {
          // فتح ثريد المناقشة فارغاً تحته
          await sentMessage.startThread({
            name: `Discussion - ${message.author.username}`,
            autoArchiveDuration: 1440,
          }).catch((err) => {
            logger.error('Failed to create suggestion thread:', err);
          });
        }

        return;
      }

      // ==========================================
      // 3. نظام تغيير اسم التكت تلقائياً
      // ==========================================
      await handleTicketAutoRename(message);

    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  },
};

// دوال المساعدة للضريبة (Tax)
function parseTaxInput(input) {
  let cleanInput = input.toLowerCase().replace(/,/g, '');
  let multiplier = 1;

  if (cleanInput.endsWith('k')) {
    multiplier = 1000;
    cleanInput = cleanInput.slice(0, -1);
  } else if (cleanInput.endsWith('m')) {
    multiplier = 1000000;
    cleanInput = cleanInput.slice(0, -1);
  }

  const number = parseFloat(cleanInput);
  return isNaN(number) ? NaN : Math.floor(number * multiplier);
}

function formatNumber(num) {
  return num.toLocaleString('en-US');
}

// دالة تغيير اسم التكت
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
