import { Events } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import { logger } from '../utils/logger.js';

// الآيديات الخاصة بك
const VOICE_CHANNEL_ID = '1415546159417655346';
const GUILD_ID = '1343103634761715755';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      const guild = client.guilds.cache.get(GUILD_ID);
      if (!guild) {
        logger.error('Voice 24/7: Guild not found!');
        return;
      }

      const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
      if (!channel || channel.type !== 2) { // 2 تعني روم صوتي (GuildVoice)
        logger.error('Voice 24/7: Voice channel not found or invalid type!');
        return;
      }

      // دالة الدخول وإعادة الاتصال التلقائي
      async function connectToVoice() {
        try {
          const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
          });

          // مراقبة الاتصال وإعادة الاتصال فوراً في حال الانقطاع أو الخروج
          connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
              await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
            } catch (error) {
              logger.warn('Voice connection lost. Reconnecting...');
              connection.destroy();
              setTimeout(connectToVoice, 3000);
            }
          });

          connection.on(VoiceConnectionStatus.Ready, () => {
            logger.info(`Bot successfully joined and staying in voice channel: ${channel.name}`);
          });

        } catch (error) {
          logger.error('Error in voice connection:', error);
          setTimeout(connectToVoice, 5000);
        }
      }

      // تشغيل الدالة فور إقلاع البوت
      connectToVoice();

    } catch (error) {
      logger.error('Error in Voice 24/7 system:', error);
    }
  },
};
