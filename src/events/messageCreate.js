import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logger } from '../utils/logger.js';

// آيدي روم الاقتراحات
const SUGGESTIONS_CHANNEL_ID = '1437792846907183165';

// أيدي روم الضريبة المحدد لإرسال اللوحة فيه
const TAX_CHANNEL_ID = '1415584488401928292';

// الرول الوحيدة المسموح لها بالأوامر الإدارية والضريبة
const ALLOWED_ROLES = [
  '1414751141706731691',
];

// مجموعة لحفظ آيديات الرسائل التي تم معالجتها لمنع التكرار
const processedMessages = new Set();

// تخزين حالة الاتصال الصوتي لمنع تكرار الانضمام
let persistentConnection = null;

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      if (message.author.bot || !message.guild) return;

      // منع تكرار معالجة نفس الرسالة
      if (processedMessages.has(message.id)) return;
      processedMessages.add(message.id);
      setTimeout(() => processedMessages.delete(message.id), 60000);

      const content = message.content.trim();
      const args = content.split(/\s+/);
      const command = args[0].toLowerCase();

      // ==========================================
      // 1. نظام الاقتراحات التلقائي
      // ==========================================
      if (message.channel.id === SUGGESTIONS_CHANNEL_ID) {
        const suggestionText = message.content;
        if (!suggestionText) return;

        // حذف رسالة العضو الأصلية فوراً
        await message.delete().catch(() => {});

        // رابط الخط المتحرك
        const lineGifUrl = 'https://cdn.discordapp.com/attachments/1391737614926614588/1555914383253708850/standard-1.gif?backend=b2&ex=6ac39330&is=6ac241b0&hm=a59fa9266ef864e2fbf9d7f6b1d369c6fb4381d859482fab5f15a31dbf48187d&';

        // تصميم إمبد الاقتراح
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

      // ==========================================
      // 2. الردود العامة (للجميع بدون استثناء)
      // ==========================================
      if (command === 'ip') {
        await message.reply('144.217.62.159:7777').catch(() => {});
        return;
      } else if (command === 'fayt') {
        await message.reply('pr.sampdroid.app:7777').catch(() => {});
        return;
      }

      // ==========================================
      // 3. أمر لوحة أزرار الضريبة (يعمل فقط في الروم المحدد للضريبة)
      // ==========================================
      if (command === 'ضريبة' || command === 'taxpanel') {
        if (message.channel.id !== TAX_CHANNEL_ID) {
          return message.reply(`❌ هذا الأمر مخصص فقط في روم الضريبة المحدد!`).catch(() => {});
        }

        const hasAllowedRole = message.member?.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));
        if (!hasAllowedRole) return;

        const embed = new EmbedBuilder()
          .setColor('#ff0055')
          .setTitle('DZ TOP | MODS 6K - Tax & Mediator System')
          .setDescription('اضغط على الأزرار بالأسفل لحساب الضريبة أو طلب الوسيط.')
          .setThumbnail(message.guild.iconURL({ dynamic: true }));

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('open_tax_modal')
            .setLabel('Tax')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('mediator_btn')
            .setLabel('Mediator')
            .setStyle(ButtonStyle.Secondary)
        );

        await message.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
        await message.delete().catch(() => {});
        return;
      }

      // ==========================================
      // التحقق من صلاحيات الرول لباقي الأوامر الإدارية والخاصة
      // ==========================================
      const hasAllowedRole = message.member?.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));
      if (!hasAllowedRole) {
        // إذا لم يكن إدارياً، نجرب فحص التكت التلقائي
        await handleTicketAutoRename(message);
        return;
      }

      // ==========================================
      // 4. الردود التلقائية المخصصة للإداريين
      // ==========================================
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

      // ==========================================
      // 5. الأوامر الصوتية والإدارية (join, مسح, تف, ايام إلخ)
      // ==========================================

      // أ) أمر الدخول الدائم للفويس (join)
      if (command === 'join') {
        try {
          const targetVoiceChannelId = '1415546159417655346';
          const guild = message.guild;
          const channel = await guild.channels.fetch(targetVoiceChannelId).catch(() => null);

          if (!channel) {
            return message.reply('❌ لم يتم العثور على الروم الصوتي المحدد!').catch(() => {});
          }

          const { joinVoiceChannel, VoiceConnectionStatus, entersState } = await import('@discordjs/voice');
          
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
                logger.error('فشل إعادة الاتصال التلقائي للفويس:', e);
              }
            }
          });

          await message.reply(`✅ تم بنجاح! البوت الآن متواجد في روم: **${channel.name}** وسيبقى متصلاً 24 ساعة.`).catch(() => {});
        } catch (err) {
          logger.error('Error in join command:', err);
          await message.reply('❌ حدث خطأ أثناء محاولة دخول البوت للفويس.').catch(() => {});
        }
        return;
      }

      // ب) أمر المسح (مسح 9)
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

      // ج) أمر الحظر (تف @user السبب)
      if (command === 'تف') {
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد حظره (مثال: `تف @user`).').catch(() => {});
        if (!targetMember.bannable) return message.reply('❌ لا يمكنني حظر هذا الشخص.').catch(() => {});

        const reason = args.slice(2).join(' ') || 'بدون سبب';
        await targetMember.ban({ reason }).catch(() => {});
        await message.reply(`🔨 تم حظر ${targetMember.user.tag} بنجاح.`).catch(() => {});
        return;
      }

      // د) أمر السحب (ايا @user)
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

      // هـ) أمر الطرد من الصوت (قود @user)
      if (command === 'قود') {
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص (مثال: `قود @user`).').catch(() => {});
        if (!targetMember.voice.channel) return message.reply('❌ هذا الشخص غير متصل بروم صوتي.').catch(() => {});

        await targetMember.voice.disconnect().catch(() => {});
        await message.reply(`🚪 تم طرد ${targetMember.user.tag} من الروم الصوتي.`).catch(() => {});
        return;
      }

      // و) أمر الميوت الصوتي (اسكت @user)
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

      // ز) أمر التايم أوت (تايم @user 10m)
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

      // 6. التحقق من التكت التلقائي إذا لم تطابق أي أمر إداري
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
