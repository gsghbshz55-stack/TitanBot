
import { Events, EmbedBuilder } from 'discord.js';

// آيدي روم الاقتراحات الخاص بك
const SUGGESTION_CHANNEL_ID = '1437792846907183165';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // التحقق إذا كانت الرسالة تبدأ بكلمة اقتراح (مثال: اقتراح إضافة نظام كذا...)
    if (message.content.startsWith('اقتراح ')) {
      // التأكد أن العضو يكتب في روم الاقتراحات المحدد
      if (message.channel.id !== SUGGESTION_CHANNEL_ID) return;

      const suggestionText = message.content.slice(7).trim(); // استخراج النص بعد كلمة اقتراح
      if (!suggestionText) return message.reply('❌ يرجى كتابة اقتراحك بعد الكلمة (مثال: `اقتراح إضافة روم جديد`).');

      try {
        // حذف رسالة العضو الأصلية ليبقى الشات منظماً
        await message.delete().catch(() => {});

        // تصميم الـ Embed البسيط
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setAuthor({ 
            name: message.author.tag, 
            iconURL: message.author.displayAvatarURL({ dynamic: true }) 
          })
          .setTitle('💡 اقتراح جديد')
          .setDescription(suggestionText)
          .setTimestamp();

        // إرسال الاقتراح في الروم
        const sentMsg = await message.channel.send({ embeds: [embed] });

        // إضافة إيموجيات التصويت تلقائياً للرسالة
        await sentMsg.react('👍');
        await sentMsg.react('👎');

      } catch (error) {
        console.error('خطأ في نظام الاقتراحات:', error);
      }
    }
  }
};
