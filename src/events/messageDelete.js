import { Events } from 'discord.js';
import { logger } from '../utils/logger.js';
// ... (باقي الـ imports الموجودة لديك)

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      if (message.author.bot || !message.guild) return;

      // 1. تفعيل ميزة تغيير اسم التكت تلقائياً عند أول رسالة
      await handleTicketAutoRename(message);

      // ... (باقي الوظائف مثل الأوامر، التفاعل، الردود التلقائية)
      
    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  }
};

// 2. دالة تغيير اسم التكت تلقائياً (الرقم - أول كلمة يكتبها العضو)
async function handleTicketAutoRename(message) {
  try {
    const channel = message.channel;

    // التحقق من أن القناة عبارة عن تكت (تبدأ بـ ticket-)
    if (!channel.name.toLowerCase().startsWith('ticket-')) return;

    // فحص الرسائل للتأكد أنها أول رسالة يكتبها العضو (وليست للبوت)
    const messages = await channel.messages.fetch({ limit: 15 });
    const userMessages = messages.filter(msg => !msg.author.bot);

    if (userMessages.size === 1) {
      // استخراج رقم التكت من الاسم الحالي (مثال: 0897)
      const ticketNumberMatch = channel.name.match(/\d+/);
      const ticketNumber = ticketNumberMatch ? ticketNumberMatch[0] : '';

      // أخذ أول كلمة كتبها العضو
      const firstWord = message.content.trim().split(/\s+/)[0];
      if (!firstWord) return;

      // تنظيف الكلمة لتتوافق مع شروط أسماء قنوات ديسكورد (عربي، إنجليزي، أرقام)
      const cleanWord = firstWord.replace(/[^\w\u0600-\u06FF-]/g, '');

      if (cleanWord.length > 0) {
        // تشكيل الاسم الجديد (الرقم - الكلمة الأولى)
        const newName = ticketNumber ? `${ticketNumber}-${cleanWord}` : cleanWord;

        await channel.setName(newName);
        logger.info(`Ticket renamed to ${newName} by ${message.author.tag}`);
      }
    }
  } catch (error) {
    logger.error('Error changing ticket name (Check Bot Permissions):', error);
  }
}
