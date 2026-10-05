import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import { logger } from '../utils/logger.js';

// آيديات الرومات
const FEEDBACK_CHANNEL_ID = '1391737804781916160';
const TAX_CHANNEL_ID = '1415584488401928292'; // روم الضريبة التلقائي

// الرول الوحيدة المسموح لها بالأوامر الإدارية والصوتية
const ALLOWED_ROLES = [
  '1414751141706731691',
];

// مجموعة لحفظ آيديات الرسائل لمنع التكرار
const processedMessages = new Set();

// تخزين حالة الاتصال الصوتي لمنع تكرار الانضمام وللبقاء 24 ساعة
let persistentConnection = null;

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      if (message.author.bot || !message.guild) return;

      // ==========================================
      // 1. نظام الضريبة التلقائي
      // ==========================================
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

      // ==========================================
      // 2. نظام الآراء (Feedback)
      // ==========================================
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

      // ==========================================
      // معالجة الأوامر والردود العامة والإدارية
      // ==========================================
      const content = message.content.trim();
      const args = content.split(/\s+/);
      const command = args[0].toLowerCase();

      // أ) الردود العامة (للجميع)
      if (command === 'ip') {
        await message.reply('144.217.62.159:7777').catch(() => {});
        return;
      } else if (command === 'fayt') {
        await message.reply('pr.sampdroid.app:7777').catch(() => {});
        return;
      }

      // التحقق من الرول المحددة لباقي الأوامر
      const hasAllowedRole = message.member?.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));
      if (!hasAllowedRole) {
        // إذا لم يكن لديه الرول، نجرب نظام تغيير اسم التكت تلقائياً إذا كان في روم تكت
        await handleTicketAutoRename(message);
        return;
      }

      // ب) الردود التلقائية المخصصة
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

      // ج) أمر دخول الفويس (join)
      if (command === 'join') {
        try {
          const targetVoiceChannelId = '1415546159417655346';
          const guild = message.guild;
          const channel = await guild.channels.fetch(targetVoiceChannelId).catch(() => null);

          if (!channel) {
            return message.reply('❌ لم يتم العثور على الروم الصوتي المحدد!').catch(() => {});
          }

          if (persistentConnection && persistentConnection.state.status !== VoiceConnectionStatus.Destroyed) {
            return message.reply(`✅ البوت متواجد بالفعل في الروم الصوتي بشكل دائم!`).catch(() => {});
          }

          const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
          });

          persistentConnection = connection;

          connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
              await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
            } catch {
              try {
                persistentConnection = joinVoiceChannel({
                  channelId: channel.id,
                  guildId: guild.id,
                  adapterCreator: guild.voiceAdapterCreator,
                  selfDeaf: true,
                  selfMute: true
                });
              } catch (e) {
                console.error('فشل إعادة الاتصال التلقائي للفويس:', e);
              }
            }
          });

          await message.reply(`✅ تم بنجاح! البوت الآن متواجد في روم: **${channel.name}** وسيبقى متصلاً 24 ساعة.`).catch(() => {});
        } catch (err) {
          console.error(err);
          await message.reply('❌ حدث خطأ أثناء محاولة دخول البوت للفويس.').catch(() => {});
        }
        return;
      }

      // د) الأوامر الإدارية (مسح، تف، ايا، قود، اسكت، تايم)
      if (command === 'مسح') {
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
          return message.reply('❌ يرجى كتابة عدد صحيح من 1 إلى 100 (مثال: `مسح 9`).').catch(() => {});
        }

        await message.delete().catch(() => {});
        const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
        
        if (deleted) {
          const msg = await message.channel.send(`✅ تم مسح **${deleted.size}** رسالة.`).catch(() => {});
          setTimeout(() => msg?.delete().catch(() => {}), 3000);
        }
        return;
      }

      if (command === 'تف') {
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد حظره (مثال: `تف @user`).').catch(() => {});
        if (!targetMember.bannable) return message.reply('❌ لا يمكنني حظر هذا الشخص.').catch(() => {});

        const reason = args.slice(2).join(' ') || 'بدون سبب';
        await targetMember.ban({ reason }).catch(() => {});
        await message.reply(`🔨 تم حظر ${targetMember.user.tag} بنجاح.`).catch(() => {});
        return;
      }

      if (command === 'ايا') {
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص (مثال: `ايا @user`).').catch(() => {});

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ يجب أن تكون داخل روم صوتي لسحبه إليك.').catch(() => {});
        if (!targetMember.voice.channel) return message.reply('❌ هذا الشخص غير متصل بروم صوتي.').catch(() => {});

        await targetMember.voice.setChannel(voiceChannel).catch(() => {});
        await message.reply(`📥 تم سحب ${targetMember.user.tag} إلى رومك.`).catch(() => {});
        return;
      }

      if (command === 'قود') {
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص (مثال: `قود @user`).').catch(() => {});
        if (!targetMember.voice.channel) return message.reply('❌ هذا الشخص غير متصل بروم صوتي.').catch(() => {});

        await targetMember.voice.disconnect().catch(() => {});
        await message.reply(`🚪 تم طرد ${targetMember.user.tag} من الروم الصوتي.`).catch(() => {});
        return;
      }

      if (command === 'اسكت') {
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص (مثال: `اسكت @user`).').catch(() => {});
        if (!targetMember.voice.channel) return message.reply('❌ هذا الشخص غير متصل بروم صوتي.').catch(() => {});

        const isMuted = targetMember.voice.serverMute;
        await targetMember.voice.setMute(!isMuted).catch(() => {});

        if (!isMuted) {
          await message.reply(`🔇 تم إعطاء ميوت صوتي لـ ${targetMember.user.tag}`).catch(() => {});
        } else {
          await message.reply(`🔊 تم فك الميوت الصوتي عن ${targetMember.user.tag}`).catch(() => {});
        }
        return;
      }

      if (command === 'تايم') {
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص وكتابة المدة (مثال: `تايم @user 10m`).').catch(() => {});
        if (!targetMember.moderatable) return message.reply('❌ لا يمكنني إعطاء تايم أوت لهذا الشخص.').catch(() => {});

        const durationArg = args[2]?.toLowerCase();
        if (!durationArg) return message.reply('❌ يرجى تحديد المدة مثل: `10m` (دقائق) أو `1h` (ساعات).').catch(() => {});

        let ms = 0;
        if (durationArg.endsWith('m')) {
          ms = parseInt(durationArg) * 60 * 1000;
        } else if (durationArg.endsWith('h')) {
          ms = parseInt(durationArg) * 60 * 60 * 1000;
        } else if (durationArg.endsWith('d')) {
          ms = parseInt(durationArg) * 24 * 60 * 60 * 1000;
        } else {
          ms = parseInt(durationArg) * 60 * 1000;
        }

        if (isNaN(ms) || ms <= 0) return message.reply('❌ صياغة المدة غير صحيحة.').catch(() => {});

        const reason = args.slice(3).join(' ') || 'بدون سبب';
        await targetMember.timeout(ms, reason).catch(() => {});
        await message.reply(`⏰ تم إعطاء تايم أوت لـ ${targetMember.user.tag} لمدة **${durationArg}**`).catch(() => {});
        return;
      }

      // إذا لم يكن أي مما سبق، نجرب نظام تغيير اسم التكت
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
