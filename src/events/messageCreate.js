
import { Events, EmbedBuilder } from 'discord.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message || message.author.bot || !message.guild) return;

    const content = message.content ? message.content.trim() : '';
    const args = content.split(/\s+/);
    const command = args[0].toLowerCase();

    // يمكنك اختيار الأمر الذي تفضله، هنا جعلته يعمل بكلمة 'tax' أو 'ضريبة'
    if (command === 'tax' || command === 'ضريبة') {
      const input = args[1];
      if (!input) {
        return message.reply('❌ يرجى كتابة المبلغ المراد حساب ضريبته (مثال: `tax 100k` أو `tax 1m`).').catch(() => {});
      }

      // دالة تحويل الاختصارات (مثل 6k, 1m, 500) إلى أرقام صحيحة
      let amount = parseTaxInput(input);
      if (isNaN(amount) || amount <= 0) {
        return message.reply('❌ يرجى كتابة رقم صحيح أو استخدام اختصارات صحيحة (مثل: `100k`, `1.5m`, `5000`).').catch(() => {});
      }

      // حساب الضريبة (عادة ضريبة بروبوت تبلغ 5% أو الحسبة القياسية لبروبوت ProBot)
      // المعادلة القياسية لضريبة بروبوت: المبلغ / 0.95 (أو ما يناسب حسابات الخصم)
      // بناءً على الصورة: 100000 تصبح ضريبة البوت 105264
      const botTax = Math.ceil(amount * 20 / 19); // المعادلة الشهيرة لضريبة بروبوت
      const mediatorPercentage = 2; // نسبة الوسيط 2%
      const mediatorFee = Math.ceil(amount * (mediatorPercentage / 100));
      const totalWithMediator = amount + mediatorFee;
      const fullTaxWithMediator = Math.ceil(totalWithMediator * 20 / 19);

      // تنسيق الإمبد أو النص تماماً مثل الصورة
      const resultText = `> * المبلغ: **${formatNumber(amount)}**\n> * ضريبة بروبوت: **${formatNumber(botTax)}**\n> * المبلغ كامل مع ضريبة الوسيط: **${formatNumber(totalWithMediator)}**\n> * نسبة الوسيط %2: **${formatNumber(mediatorFee)}**\n> * الضريبة كاملة مع نسبة الوسيط: **${formatNumber(fullTaxWithMediator)}**`;

      await message.reply(resultText).catch(() => {});
    }
  }
};

// دالة لمعالجة الأرقام والاختصارات الفرنسية (k, m)
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

// دالة لتنسيق الأرقام بفواصل لتكون واضحة
function formatNumber(num) {
  return num.toLocaleString('en-US');
}
