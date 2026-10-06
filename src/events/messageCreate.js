import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logger } from '../utils/logger.js';

// آيديات الرومات
const SUGGESTIONS_CHANNEL_ID = '1437792846907183165';
const FEEDBACK_CHANNEL_ID = '1391737804781916160';
const TAX_CHANNEL_ID = '1415584488401928292'; // روم الضريبة التلقائي

// الرتب المسموح لها باستخدام الأوامر والردود التلقائية (أي شخص يحمل إحدى هذه الرتب)
const ALLOWED_ROLES = [
  '1414751141706731691', // الرتبة القديمة
  '1391735874924052560', // الرتبة الجديدة التي أضفتها
];

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

          await message.delete().catch(() => {});

          const taxPro = Math.floor(amount * 20 / 19);
          const mediatorFee = Math.floor(amount * 0.02);
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

      // معالجة الرسائل العادية والردود والأوامر
      if (processedMessages.has(message.id)) return;
      processedMessages.add(message.id);
      setTimeout(() => processedMessages.delete(message.id), 5000);

      const content = message.content.trim();
      const args = content.split(/\s+/);
      const command = args[0].toLowerCase();

      // أ) الردود العامة المتاحة للجميع
      if (command === 'ip') {
        await message.reply('144.217.62.159:7777').catch(() => {});
        return;
      } else if (command === 'fayt') {
        await message.reply('pr.sampdroid.app:7777').catch(() => {});
        return;
      }

      // التحقق مما إذا كان المستخدم يمتلك إحدى الرتب المسموح لها
      const hasAllowedRole = message.member?.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));
      if (!hasAllowedRole) {
        // إذا لم يكن يمتلك الرتبة، نتحقق فقط مما إذا كان تكت لتغيير الاسم تلقائياً
        await handleTicketAutoRename(message);
        return;
      }

      // ب) الردود التلقائية الخاصة بالرتب المسموحة (خط، رابط، تفضل)
      if (command === 'رابط') {
        await message.reply('𝐃𝐙  𝐓𝐎𝐏  | 𝐌𝐎𝐃𝐒  2𝐊\nhttps://discord.gg/CdGddfWQZq').catch(() => {});
        return;
      } else if (command === 'خط') {
        await message.reply('https://cdn.discordapp.com/attachments/1391737614926614588/1555914383253708850/standard-1.gif?backend=b2&ex=6ac2ea70&is=6ac198f0&hm=15533f388cc6ffddc683615e6f416376bd0bd16b83a7ec36e905c0037bc320d7&').catch(() => {});
        return;
      } else if (command === 'تفضل') {
        const welcomeText = `> **السلام عليڪم**\n> **هـنـا طـاقـم عمـل**\n\n> **معـڪ الـعضو <@${message.author.id}> ڪيف يمكـنـني خدمتك :**\nhttps://cdn.discordapp.com/attachments/1399176418415607870/1468651951339339796/1339174610775703626.gif?ex=6984cc37&is=69837ab7&hm=72ae6401246f68cb693b3517d083d6d3ffcfc00ff35d561f5c7628cf48469052&`;
        await message.reply(welcomeText).catch(() => {});
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
