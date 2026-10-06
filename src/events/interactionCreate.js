import { Events } from 'discord.js';

// منع معالجة الرسائل المكررة
const processedMessages = new Set();

// ==========================================
// الرتب المسموح لها بالأوامر (الجديدة والقديمة)
// ==========================================
const ALLOWED_ROLES = [
  '1414751141706731691', // الرتبة القديمة
  '1391735874924052560', // الرتبة الجديدة التي طلبتها
];

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // تجاهل البوتات والرسائل الخاصة
    if (message.author.bot || !message.guild) return;

    // التأكد من عدم تكرار الرد لنفس الرسالة
    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);

    // تنظيف الذاكرة بعد 5 ثوانٍ
    setTimeout(() => {
      processedMessages.delete(message.id);
    }, 5000);

    const content = message.content.trim();
    const args = content.split(/\s+/);
    const command = args[0].toLowerCase();

    // ==========================================
    // 1. الردود العامة (للجميع بدون استثناء)
    // ==========================================
    if (command === 'ip') {
      await message.reply('144.217.62.159:7777').catch(() => {});
      return;
    } else if (command === 'fayt') {
      await message.reply('pr.sampdroid.app:7777').catch(() => {});
      return;
    }

    // ==========================================
    // التحقق من وجود إحدى الرتب المحددة لباقي الأوامر
    // ==========================================
    const hasAllowedRole = message.member?.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));
    if (!hasAllowedRole) return;

    // ==========================================
    // 2. الردود التلقائية المخصصة (مع دعم الرد على رسائل البوتات)
    // ==========================================
    if (command === 'رابط' || command === 'خط' || command === 'تفضل') {
      // التحقق مما إذا كانت الرسالة عبارة عن رد (Reply) على رسالة أخرى
      const referencedMessage = message.reference ? await message.channel.messages.fetch(message.reference.messageId).catch(() => null) : null;
      
      // حذف رسالتك الأصلية للحفاظ على نظافة الشات
      await message.delete().catch(() => {});

      let replyContent = '';
      if (command === 'رابط') {
        replyContent = '𝐃𝐙  𝐓𝐎𝐏  | 𝐌𝐎𝐃𝐒  2𝐊\nhttps://discord.gg/CdGddfWQZq';
      } else if (command === 'خط') {
        replyContent = 'https://cdn.discordapp.com/attachments/1391737614926614588/1555914383253708850/standard-1.gif?backend=b2&ex=6ac2ea70&is=6ac198f0&hm=15533f388cc6ffddc683615e6f416376bd0bd16b83a7ec36e905c0037bc320d7&';
      } else if (command === 'تفضل') {
        replyContent = `> **السلام عليڪم**\n> **هـنـا طـاقـم عمـل**\n\n> **معـڪ الـعضو <@${message.author.id}> ڪيف يمكـنـني خدمتك :**\nhttps://cdn.discordapp.com/attachments/1399176418415607870/1468651951339339796/1339174610775703626.gif?ex=6984cc37&is=69837ab7&hm=72ae6401246f68cb693b3517d083d6d3ffcfc00ff35d561f5c7628cf48469052&`;
      }

      // إذا كنت قد رددت على رسالة بوت (أو أي رسالة)، سيرد عليها مباشرة، وإلا سيقوم بإرسالها في الشات طبيعياً
      if (referencedMessage) {
        await referencedMessage.reply({ content: replyContent, allowedMentions: { repliedUser: true } }).catch(() => {});
      } else {
        await message.channel.send({ content: replyContent }).catch(() => {});
      }
      return;
    }

    // ==========================================
    // 3. الأوامر الإدارية والصوتية المختصرة
    // ==========================================

    // أ) امر دخول الفويس (join)
    if (command === 'join') {
      try {
        const targetVoiceChannelId = '1415546159417655346';
        const guild = message.guild;
        const channel = await guild.channels.fetch(targetVoiceChannelId).catch(() => null);

        if (!channel) {
          return message.reply('❌ لم يتم العثور على الروم الصوتي المحدد!').catch(() => {});
        }

        const { joinVoiceChannel, VoiceConnectionStatus, entersState } = await import('@discordjs/voice');
        
        const connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
          selfDeaf: true,
          selfMute: true
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
          try {
            await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
          } catch {
            connection.destroy();
          }
        });

        await message.reply(`✅ تم بنجاح! البوت الآن متواجد في روم: **${channel.name}**`).catch(() => {});
      } catch (err) {
        console.error(err);
        await message.reply('❌ حدث خطأ أثناء محاولة دخول البوت للفويس.').catch(() => {});
      }
      return;
    }

    // ب) امر المسح (مسح 9)
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

    // ج) امر الحظر (تف @user السبب)
    if (command === 'تف') {
      const targetMember = message.mentions.members.first();
      if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد حظره (مثال: `تف @user`).').catch(() => {});
      if (!targetMember.bannable) return message.reply('❌ لا يمكنني حظر هذا الشخص.').catch(() => {});

      const reason = args.slice(2).join(' ') || 'بدون سبب';
      await targetMember.ban({ reason }).catch(() => {});
      await message.reply(`🔨 تم حظر ${targetMember.user.tag} بنجاح.`).catch(() => {});
      return;
    }

    // د) امر السحب (ايا @user)
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

    // هـ) امر الطرد من الصوت (قود @user)
    if (command === 'قود') {
      const targetMember = message.mentions.members.first();
      if (!targetMember) return message.reply('❌ يرجى منشن الشخص (مثال: `قود @user`).').catch(() => {});
      if (!targetMember.voice.channel) return message.reply('❌ هذا الشخص غير متصل بروم صوتي.').catch(() => {});

      await targetMember.voice.disconnect().catch(() => {});
      await message.reply(`🚪 تم طرد ${targetMember.user.tag} من الروم الصوتي.`).catch(() => {});
      return;
    }

    // و) امر الميوت الصوتي (اسكت @user)
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

    // ز) امر التايم أوت (تايم @user 10m)
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
  }
};
