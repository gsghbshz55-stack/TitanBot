import { Events } from 'discord.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // تجاهل رسائل البوتات والرسائل الخاصة
    if (message.author.bot || !message.guild) return;

    // التأكد من النص
    if (message.content.trim().toLowerCase() === 'رابط') {
      await message.reply('𝐃𝐙  𝐓𝐎𝐏  | 𝐌𝐎𝐃𝐒  2𝐊\nhttps://discord.gg/CdGddfWQZq').catch(() => {});
    }
  }
};
