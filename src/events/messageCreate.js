import { Events } from 'discord.js';

// منع معالجة الرسائل المكررة
const processedMessages = new Set();

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // تجاهل البوتات والرسائل الخاصة
    if (message.author.bot || !message.guild) return;

    // التأكد من عدم تكرار الرد لنفس الرسالة
    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);

    // تنظيف ذاكرة الرسائل المعالجة بعد 5 ثوانٍ
    setTimeout(() => {
      processedMessages.delete(message.id);
    }, 5000);

    const content = message.content.trim().toLowerCase();

    // ==========================================
    // الردود التلقائية
    // ==========================================
    if (content === 'رابط') {
      await message.reply('𝐃𝐙  𝐓𝐎𝐏  | 𝐌𝐎𝐃𝐒  2𝐊\nhttps://discord.gg/CdGddfWQZq').catch(() => {});
    } else if (content === 'ip') {
      await message.reply('144.217.62.159:7777').catch(() => {});
    } else if (content === 'fayt') {
      await message.reply('pr.sampdroid.app:7777').catch(() => {});
    } else if (content === 'خط') {
      await message.reply('https://cdn.discordapp.com/attachments/1391737614926614588/1555914383253708850/standard-1.gif?backend=b2&ex=6ac2ea70&is=6ac198f0&hm=15533f388cc6ffddc683615e6f416376bd0bd16b83a7ec36e905c0037bc320d7&').catch(() => {});
    }
  }
};
