import { Events } from 'discord.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      // تجاهل رسائل البوتات أو الرسائل التي خارج السيرفرات
      if (message.author.bot || !message.guild) return;

      // تشغيل ميزة تغيير اسم التكت تلقائياً والرسالة الترحيبية
      await handleTicketAutoRename(message);

    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  },
};

// دالة تغيير اسم التكت التلقائية والترحيب
async function handleTicketAutoRename(message) {
  try {
    const channel = message.channel;

    // 1. التحقق من أن القناة تبدأ بـ ticket-
    if (!channel.name.toLowerCase().startsWith('ticket-')) return;

    // 2. إذا تم تغيير اسم التكت من قبل، نتوقف
    const parts = channel.name.split('-');
    if (parts.length > 2) return; 

    // 3. أخذ أول كلمة كتبها العضو
    const firstWord = message.content.trim().split(/\s+/)[0];
    if (!firstWord) return;

    // تنظيف الكلمة (تقبل العربي، الإنجليزي، والأرقام)
    const cleanWord = firstWord.replace(/[^\w\u0600-\u06FF-]/g, '');

    if (cleanWord.length > 0) {
      // استخراج رقم التكت من الاسم الحالي
      const ticketNumberMatch = channel.name.match(/\d+/);
      const ticketNumber = ticketNumberMatch ? ticketNumberMatch[0] : '0000';

      // تشكيل الاسم الجديد (الرقم - الكلمة الأولى)
      const newName = `${ticketNumber}-${cleanWord}`;

      // إرسال الرسالة الترحيبية المزخرفة مع الإيموجي الجديد الصحيح أولاً
      await channel.send({
        content: `**مرحبا بيك  سوف يتم تغير اسم تكت خاص بيك علي اول كلة تكتبه  تسهيل  عملية   وشكرا مع اطيب تحياتي دعم فني    <:emoji141:1556273384986378311>**`
      }).catch(() => {});

      // تغيير اسم القناة فوراً
      await channel.setName(newName);
      logger.info(`Ticket renamed successfully to ${newName}`);
    }
  } catch (error) {
    logger.error('Error handling ticket rename (Make sure Bot has Manage Channels permission):', error);
  }
}
