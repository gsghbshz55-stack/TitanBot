import { Events } from "discord.js";
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import { logger, startupLog } from "../utils/logger.js";
import config from "../config/application.js";
import { reconcileReactionRoleMessages } from "../services/reactionRoleService.js";
import { reconcileTicketPanels, reconcileVerificationPanels, reconcileReactionRolePanelHealth } from "../services/panelHealthService.js";
import { reconcileLevelRoles } from "../services/leveling/levelRoleSyncService.js";
import { initRiffyAfterReady } from "../services/music/riffySetup.js";

// الآيديات الخاصة بك
const VOICE_CHANNEL_ID = '1415546159417655346';
const GUILD_ID = '1343103634761715755';

export default {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    try {
      client.user.setPresence(config.bot.presence);

      startupLog(`Ready! Logged in as ${client.user.tag}`);
      startupLog(`Serving ${client.guilds.cache.size} guild(s)`);
      startupLog(`Loaded ${client.commands.size} commands`);

      if (client.config?.features?.music) {
        initRiffyAfterReady(client);
      }

      // نظام البقاء الدائم في الروم الصوتي 24/7 مع إعادة الاتصال التلقائي القسري
      setTimeout(async () => {
        try {
          const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
          if (!guild) {
            logger.error('Voice 24/7: Guild not found!');
            return;
          }

          const channel = await guild.channels.fetch(VOICE_CHANNEL_ID).catch(() => null);
          if (!channel || channel.type !== 2) {
            logger.error('Voice 24/7: Voice channel not found or invalid type!');
            return;
          }

          function connectToVoice() {
            try {
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
                  logger.warn('Voice connection lost. Forcing reconnection...');
                  connection.destroy();
                  setTimeout(connectToVoice, 2000);
                }
              });

              connection.on(VoiceConnectionStatus.Ready, () => {
                startupLog(`Bot successfully joined and staying in voice channel: ${channel.name}`);
              });

            } catch (error) {
              logger.error('Error in voice connection loop:', error);
              setTimeout(connectToVoice, 5000);
            }
          }

          connectToVoice();

          // فحص دوري كل 15 ثانية للتأكد أن البوت لا يزال في الروم وإذا خرج يعيد دخوله فوراً
          setInterval(async () => {
            try {
              const currentGuild = client.guilds.cache.get(GUILD_ID);
              if (currentGuild) {
                const botMember = currentGuild.members.me;
                if (!botMember?.voice?.channelId || botMember.voice.channelId !== VOICE_CHANNEL_ID) {
                  logger.warn('Bot was disconnected from 24/7 voice channel. Rejoining...');
                  connectToVoice();
                }
              }
            } catch (err) {
              logger.error('Error in 24/7 voice watchdog:', err);
            }
          }, 15000);

        } catch (err) {
          logger.error('Error initializing 24/7 voice system:', err);
        }
      }, 3000);

      const reconciliationSummary = await reconcileReactionRoleMessages(client);
      startupLog(
        `Reaction role reconciliation: scanned ${reconciliationSummary.scannedMessages}, removed ${reconciliationSummary.removedMessages}, errors ${reconciliationSummary.errors}`
      );

      const ticketPanelSummary = await reconcileTicketPanels(client);
      startupLog(
        `Ticket panel health: scanned ${ticketPanelSummary.scannedGuilds} guilds, healthy ${ticketPanelSummary.healthyPanels}, deleted ${ticketPanelSummary.deletedPanels}, missing channel ${ticketPanelSummary.missingChannels}, recovered ${ticketPanelSummary.recoveredIds}, errors ${ticketPanelSummary.errors}`
      );

      const verificationPanelSummary = await reconcileVerificationPanels(client);
      startupLog(
        `Verification panel health: scanned ${verificationPanelSummary.scannedGuilds} guilds, healthy ${verificationPanelSummary.healthyPanels}, deleted ${verificationPanelSummary.deletedPanels}, missing channel ${verificationPanelSummary.missingChannels}, recovered ${verificationPanelSummary.recoveredIds}, errors ${verificationPanelSummary.errors}`
      );

      const reactionRolePanelSummary = await reconcileReactionRolePanelHealth(client);
      startupLog(
        `Reaction role panel health: scanned ${reactionRolePanelSummary.scannedPanels} panels, healthy ${reactionRolePanelSummary.healthyPanels}, deleted ${reactionRolePanelSummary.deletedPanels}, missing channel ${reactionRolePanelSummary.missingChannels}, recovered ${reactionRolePanelSummary.recoveredIds}, errors ${reactionRolePanelSummary.errors}`
      );

      const levelRoleSummary = `Level role sync: scanned 1 guilds...`; // مرجع مختصر
    } catch (error) {
      logger.error("Error in ready event:", error);
    }
  },
};
