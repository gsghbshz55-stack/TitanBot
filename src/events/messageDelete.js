import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

// منع معالجة الرسائل المكررة
const processedMessages = new Set();

// تخزين حالة الاتصال الصوتي لمنع تكرار الانضمام
let persistentConnection = null;

// ==========================================
// الرول الوحيدة المسموح لها بالأوامر الإدارية (1414751141706731691)
// ==========================================
const ALLOWED_ROLES = [
  '1414751141706731691',
];

// دالة تحويل الاختصارات (1k -> 1000, 1m -> 1000000) وقراءة الأرقام
function parseNumberInput(input) {
  if (!input) return NaN;
  let cleanInput = input.toString().trim().toLowerCase().replace(/,/g, '');
  let multiplier = 1;

  if (cleanInput.endsWith('k')) {
    multiplier = 1000;
    cleanInput = cleanInput.slice(0, -1);
  } else if (cleanInput.endsWith('m')) {
    multiplier = 1000000;
    cleanInput = cleanInput.slice(0, -1);
  } else if (cleanInput.endsWith('b')) {
    multiplier = 1000000000;
    cleanInput = cleanInput.slice(0, -1);
  }

  const number = parseFloat(cleanInput);
  if (isNaN(number)) return NaN;
  return Math.floor(number * multiplier);
}

// دالة تنسيق الأرقام بفاصلة الآلاف
function formatNumber(num) {
  return num.toLocaleString('en-US');
}

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // تجاهل البوتات والرسائل الخاصة
    if (message.author.bot || !message.guild) return;

    // معالجة الأزرار والنوافذ التفاعلية في حال استخدامها كـ Interaction (إذا تم تفعيلها في ملف InteractionCreate منفصل، أو يمكنك دمجها هنا إذا أردت، لكن الأفضل تركها هنا أو التعامل معها)
    // ملاحظة: الأزرار والنوافذ يتم معالجتها عادة عبر حدث interactionCreate. سنضع كود الأزرار في الأسفل ليعمل معاً بسلاسة.

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
    // أمر إرسال لوحة أزرار الضريبة (متاح للإداريين أو للجميع حسب رغبتك)
    // ==========================================
    if (command === 'ضريبة' || command === 'taxpanel') {
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
    // التحقق من وجود الرول المحددة لباقي الأوامر
    // ==========================================
    const hasAllowedRole = message.member?.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));
    if (!hasAllowedRole) return;

    // ==========================================
    // 2. الردود التلقائية المخصصة
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
    // 3. الأوامر الإدارية والصوتية المختصرة (24/7)
    // ==========================================

    // أ) امر دخول الفويس والبقاء بشكل دائم (join)
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
              console.error('فشل إعادة الاتصال التلقائي للفويس:', e);
            }
          }
        });

        await message.reply(`✅ تم بنجاح! البوت الآن متواجد في روم: **${nameOfChannel(channel)}** وسيبقى متصلاً 24 ساعة.`).catch(() => {});
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

// ==========================================
// معالجة الأزرار والنوافذ (Interaction Handler)
// يمكنك وضع هذا في ملف interactionCreate.js أو دمج التعامل معه
// ==========================================
export async function handleTaxInteractions(interaction) {
  if (interaction.isButton()) {
    if (interaction.customId === 'open_tax_modal') {
      const modal = new ModalBuilder()
        .setCustomId('tax_modal')
        .setTitle('حساب ضريبة البروبوت');

      const amountInput = new TextInputBuilder()
        .setCustomId('tax_amount_input')
        .setLabel('أدخل المبلغ (مثال: 1000000 أو 1m أو 1k)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(amountInput);
      modal.addComponents(row);

      await interaction.showModal(modal).catch(() => {});
    } else if (interaction.customId === 'mediator_btn') {
      await interaction.reply({
        content: `> **هذا هو صانع البوت / المسؤول:**\n> <@1382453552081010709>`,
        ephemeral: true
      }).catch(() => {});
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === 'tax_modal') {
      const rawInput = interaction.fields.getTextInputValue('tax_amount_input');
      const amount = parseNumberInput(rawInput);

      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({ content: '❌ يرجى إدخال رقم صحيح (مثل `1000000` أو `1m`).', ephemeral: true }).catch(() => {});
      }

      // حساب ضريبة بروبوت (ProBot Tax Formula: x / 0.95)
      const tax = Math.ceil(amount / 0.95);
      // نسبة الوسيط 2%
      const mediatorFee = Math.ceil(amount * 0.02);
      const totalWithMediator = tax + mediatorFee;

      const embed = new EmbedBuilder()
        .setColor('#ff0055')
        .setThumbnail(interaction.guild?.iconURL({ dynamic: true }) || null)
        .addFields(
          { name: '• المبلغ:', value: `\`${formatNumber(amount)}\``, inline: false },
          { name: '• ضريبة بروبوت:', value: `\`${formatNumber(tax)}\``, inline: false },
          { name: '• المبلغ كامل مع ضريبة الوسيط:', value: `\`${formatNumber(totalWithMediator)}\``, inline: false },
          { name: '• نسبة الوسيط (2%):', value: `\`${formatNumber(mediatorFee)}\``, inline: false },
          { name: '• الضريبة كاملة مع نسبة الوسيط:', value: `\`${formatNumber(totalWithMediator)}\``, inline: false }
        );

      await interaction.reply({ embeds: [embed], ephemeral: false }).catch(() => {});
    }
  }
}

function nameOfChannel(channel) {
  return channel.name;
}
