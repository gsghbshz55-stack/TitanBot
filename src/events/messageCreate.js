import { Events } from 'discord.js';

// منع معالجة الرسائل المكررة
const processedMessages = new Set();

// ==========================================
// آيديهات الرولات المسموح لها لرابط وخط وتفضل
// ==========================================
const ALLOWED_ROLES = [
  '1391735874924052560', // الآيدي الخاص بك
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

    const content = message.content.trim().toLowerCase();

    // ==========================================
    // 1. الردود العامة (للجميع بدون استثناء)
    // ==========================================
    if (content === 'ip') {
      await message.reply('144.217.62.159:7777').catch(() => {});
      return;
    } else if (content === 'fayt') {
      await message.reply('pr.sampdroid.app:7777').catch(() => {});
      return;
    }

    // ==========================================
    // 2. الردود المخصصة للرولات فقط (رابط / خط / تفضل)
    // ==========================================
    if (content === 'رابط' || content === 'خط' || content === 'تفضل') {
      // التحقق مما إذا كان الشخص يملك الرول المسموح
      const hasAllowedRole = message.member?.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));

      // إذا لم يكن يملك الرول المطلوبة، لن يرد البوت
      if (!hasAllowedRole) return;

      if (content === 'رابط') {
        await message.reply('𝐃𝐙  𝐓𝐎𝐏  | 𝐌𝐎𝐃𝐒  2𝐊\nhttps://discord.gg/CdGddfWQZq').catch(() => {});
      } else if (content === 'خط') {
        await message.reply('https://cdn.discordapp.com/attachments/1391737614926614588/1555914383253708850/standard-1.gif?backend=b2&ex=6ac2ea70&is=6ac198f0&hm=15533f388cc6ffddc683615e6f416376bd0bd16b83a7ec36e905c0037bc320d7&').catch(() => {});
      } else if (content === 'تفضل') {
        const welcomeText = `> **السلام عليڪم**\n> **هـنـا طـاقـم عمـل**\n\n> **معـڪ الـعضو <@${message.author.id}> ڪيف يمكـنـني خدمتك :**\nhttps://cdn.discordapp.com/attachments/1399176418415607870/1468651951339339796/1339174610775703626.gif?ex=6984cc37&is=69837ab7&hm=72ae6401246f68cb693b3517d083d6d3ffcfc00ff35d561f5c7628cf48469052&`;
        await message.reply(welcomeText).catch(() => {});
      }
    }
  }
};
