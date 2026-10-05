import { Events } from 'discord.js';

// يمكنك تحديد آيدي روم معين إذا أردت أن يعمل الأمر فيه فقط، أو تركه فارغاً ليشتغل في كل الرومات
const ALLOWED_CHANNEL_ID = '1415584488401928292'; // آيدي الروم الذي أرسلته

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message || message.author.bot || !message.guild) return;

    // إذا أردت أن يعمل الأمر في الروم المحدد فقط (قم بإلغاء التفعيل بحذف الشرط لو تريده بكل الرومات)
    if (message.channel.id !== ALLOWED_CHANNEL_ID) return;

    const content = message.content ? message.content.trim() : '';
    const args = content.split(/\s+/);
    const command = args[0].toLowerCase();

    // يمكنك استخدام 'tax' أو 'ضريبة'
    if (command === 'tax' || command === 'ضريبة') {
      const input = args[1];
      if (!input) {
        return message.reply('❌ يرجى كتابة المبلغ المراد حساب ضريبته (مثال: `100k` أو `1m`).').catch(() => {});
      }

      // تحويل الاختصارات الفرنسية (k, m) إلى أرقام حقيقية
      let amount = parseTaxInput(input);
      if (isNaN(amount) || amount <= 0) {
        return message.reply('❌ يرجى كتابة رقم صحيح أو استخدام اختصارات صحيحة مثل: `100k` أو `1m`.').catch(() => {});
      }

      // الحسابات والنسب تماماً مثل الصورة
      const botTax = Math.ceil(amount * 20 / 19); // ضريبة بروبوت
      const mediatorPercentage = 2; // نسبة الوسيط 2%
      const mediatorFee = Math.ceil(amount * (mediatorPercentage / 100));
      const totalWithMediator = amount + mediatorFee;
      const fullTaxWithMediator = Math.ceil(totalWithMediator * 20 / 19);

      // تنسيق الناتج بنفس شكل الصورة بالضبط
      const resultText = `> * المبلغ: **${formatNumber(amount)}**\n> * ضريبة بروبوت: **${formatNumber(botTax)}**\n> * المبلغ كامل مع ضريبة الوسيط: **${formatNumber(totalWithMediator)}**\n> * نسبة الوسيط %2: **${formatNumber(mediatorFee)}**\n> * الضريبة كاملة مع نسبة الوسيط: **${formatNumber(fullTaxWithMediator)}**`;

      await message.reply(resultText).catch(() => {});
    }
  }
};

// دالة لمعالجة الاختصارات (k و m)
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

// دالة لتنسيق الأرقام بفواصل
function formatNumber(num) {
  return num.toLocaleString('en-US');
}
