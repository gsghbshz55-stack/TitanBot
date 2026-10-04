import { EmbedBuilder } from 'discord.js';
import axios from 'axios';

const AZKAR_CHANNEL_ID = '1435618260581355603';

export function startAzkarSystem(client) {
    // إرسال ذكر كل ساعة
    setInterval(async () => {
        try {
            const channel = await client.channels.fetch(AZKAR_CHANNEL_ID).catch(() => null);
            if (!channel) return;

            // جلب الأذكار من الـ API
            const response = await axios.get('https://raw.githubusercontent.com/hisnmuslim/hisnmuslim-api/main/ar/azkar.json');
            const data = response.data;

            const categories = Object.keys(data);
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const zikrList = data[randomCategory];
            const randomZikr = zikrList[Math.floor(Math.random() * zikrList.length)];

            const azkarEmbed = new EmbedBuilder()
                .setTitle('أذكار وآيات')
                .setDescription(`**${randomCategory}**\n\n${randomZikr.ARABIC_TEXT || randomZikr.text}`)
                .setColor(0xD4AF37)
                .setFooter({ text: 'أذكار تلقائية' });

            await channel.send({ embeds: [azkarEmbed] });
        } catch (error) {
            console.error('خطأ في جلب الذكر:', error);
        }
    }, 60 * 60 * 1000); // 60 دقيقة
}
