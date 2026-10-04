import { EmbedBuilder } from 'discord.js';
import axios from 'axios';

const AZKAR_CHANNEL_ID = '1435618260581355603';

// دالة جلب وإرسال الذكر
async function sendAzkar(client) {
    try {
        const channel = await client.channels.fetch(AZKAR_CHANNEL_ID).catch(() => null);
        if (!channel) {
            console.warn(`[الأذكار] لم يتم العثور على الروم: ${AZKAR_CHANNEL_ID}`);
            return;
        }

        // جلب الأذكار من الـ API
        const response = await axios.get('https://raw.githubusercontent.com/hisnmuslim/hisnmuslim-api/main/ar/azkar.json');
        const data = response.data;

        if (!data || typeof data !== 'object') return;

        const categories = Object.keys(data);
        if (categories.length === 0) return;

        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const zikrList = data[randomCategory];

        if (!Array.isArray(zikrList) || zikrList.length === 0) return;

        const randomZikr = zikrList[Math.floor(Math.random() * zikrList.length)];
        const zikrContent = randomZikr.ARABIC_TEXT || randomZikr.text || randomZikr.Text || 'ذِكْرٌ وَدُعَاءٌ';

        const azkarEmbed = new EmbedBuilder()
            .setTitle('📖 أذكار وآيات')
            .setDescription(`**${randomCategory}**\n\n${zikrContent}`)
            .setColor(0xD4AF37)
            .setFooter({ text: 'أذكار تلقائية • SubhanAllah' })
            .setTimestamp();

        await channel.send({ embeds: [azkarEmbed] });
    } catch (error) {
        console.error('خطأ في جلب أو إرسال الذكر:', error.message);
    }
}

export function startAzkarSystem(client) {
    // إرسال أول ذكر فوراً عند تشغيل البوت
    sendAzkar(client);

    // تكرار إرسال الذكر كل ساعة (60 دقيقة)
    setInterval(() => {
        sendAzkar(client);
    }, 60 * 60 * 1000);
}
