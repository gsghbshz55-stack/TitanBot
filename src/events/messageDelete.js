import { Events, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';
// نحتاج لاستخدام مكتبة canvas أو حزمة لتوليد الصور، سنستعمل طريقة نظيفة وسريعة
import Canvas from 'canvas';

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

      // 1. نظام الاقتراحات التلقائي
      if (message.channel.id === SUGGESTIONS_CHANNEL_ID) {
        // (نفس كود الاقتراحات الخاص بك)
        return;
      }

      // 2. نظام الآراء (Feedback) بتوليد صورة فخمة
      if (message.channel.id === FEEDBACK_CHANNEL_ID) {
        const feedbackText = message.content;
        if (!feedbackText) return;

        if (processedMessages.has(message.id)) return;
        processedMessages.add(message.id);
        setTimeout(() => processedMessages.delete(message.id), 60000);

        // حذف رسالة العضو الأصلية
        await message.delete().catch(() => {});

        try {
          // إنشاء صورة احترافية باستخدام Canvas (تصميم مشابه للصورة التي أرفقتها)
          const canvas = Canvas.createCanvas(800, 400);
          const ctx = canvas.getContext('2d');

          // خلفية فخمة بتدرج لوني داكن (بنفسجي/أسود فخم)
          const backgroundGradient = ctx.createLinearGradient(0, 0, 800, 400);
          backgroundGradient.addColorStop(0, '#1a102f');
          backgroundGradient.addColorStop(1, '#0d0714');
          ctx.fillStyle = backgroundGradient;
          ctx.fillRect(0, 0, 800, 400);

          // إطار خارجي بلون أحمر/بنفسجي خفيف
          ctx.strokeStyle = '#ff334b';
          ctx.lineWidth = 4;
          ctx.strokeRect(10, 10, 780, 380);

          // كتابة عنوان "ملاحظات المستخدم" أو "Feedback"
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('ملاحظات المستخدم:', 740, 70);

          // كتابة نص الرأي الخاص بالعضو (مع الالتفاف التلقائي للأسطر الطويلة)
          ctx.fillStyle = '#b8b8b8';
          ctx.font = '22px sans-serif';
          let wrapText = feedbackText;
          if (wrapText.length > 50) wrapText = wrapText.substring(0, 47) + '...';
          ctx.fillText(wrapText, 740, 130);

          // رسم دائرة لصورة الأفاتار الخاصة بالعضو
          ctx.save();
          ctx.beginPath();
          ctx.arc(100, 300, 50, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();

          // جلب صورة الأفاتار الخاصة بالعضو
          const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 256 });
          const avatar = await Canvas.loadImage(avatarURL);
          ctx.drawImage(avatar, 50, 250, 100, 100);
          ctx.restore();

          // إطار حول صورة الأفاتار
          ctx.beginPath();
          ctx.arc(100, 300, 50, 0, Math.PI * 2, true);
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#ff334b';
          ctx.stroke();

          // كتابة اسم المستخدم (Username) تحت أو بجانب الصورة
          ctx.fillStyle = '#ffd700';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`المستخدم: ${message.author.username}`, 170, 310);

          // تحويل الكانفاس إلى Buffer لإرساله كصورة في ديسكورد
          const attachment = {
            attachment: canvas.toBuffer(),
            name: 'feedback-card.png'
          };

          // إرسال الصورة الفخمة مع الإيموجيات المخصصة
          const sentFeedback = await message.channel.send({
            content: `<:emoji_1:1556300724340523091> <:emoji_2:1556300789125873677> **• تم استلام رأيك بكل فخامة:**`,
            files: [attachment]
          });

          if (sentFeedback) {
            await sentFeedback.react('1556300724340523091').catch(() => {});
            await sentFeedback.react('1556300789125873677').catch(() => {});
          }

        } catch (canvasError) {
          logger.error('Error generating feedback image:', canvasError);
          // حل احتياطي في حال حدث خطأ في الـ Canvas يرسل إمبد عادي
          await message.channel.send(`**Feedback by ${message.author.username}:** ${feedbackText}`);
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
  // (نفس كود التكتات الخاص بك)
}
