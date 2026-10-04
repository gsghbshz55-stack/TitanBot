import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import { logger } from '../../utils/logger.js';

// الآيدي الثابت للروم الصوتي الخاص بك
const TARGET_VOICE_CHANNEL_ID = '1415546159417655346';

export default {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('يجبر البوت على الدخول إلى الروم الصوتي المحدد فوراً'),

    async execute(interaction, config, client) {
        try {
            // الرد السريع لكي لا تظهر رسالة "لم يستجب التطبيق"
            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;
            if (!guild) {
                return interaction.editReply({ content: '❌ هذا الأمر يعمل داخل السيرفرات فقط!' });
            }

            const channel = await guild.channels.fetch(TARGET_VOICE_CHANNEL_ID).catch(() => null);
            if (!channel || channel.type !== ChannelType.GuildVoice) {
                return interaction.editReply({ content: '❌ لم يتم العثور على الروم الصوتي المحدد أو أن الأيدي غير صحيح!' });
            }

            // الاتصال المباشر بالروم
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: true
            });

            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
                } catch {
                    connection.destroy();
                }
            });

            await interaction.editReply({ content: `✅ تم بنجاح! البوت الآن متواجد في روم: **${channel.name}**` });

        } catch (error) {
            logger.error('Error in join command:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '❌ حدث خطأ أثناء محاولة دخول البوت للفويس.' }).catch(() => {});
            }
        }
    },
};
