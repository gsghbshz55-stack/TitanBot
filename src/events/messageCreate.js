import { Events, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { logger } from '../utils/logger.js';
import { getLevelingConfig, getUserLevelData } from '../services/leveling/leveling.js';
import { addXp } from '../services/leveling/xpSystem.js';
import { checkRateLimit } from '../utils/rateLimiter.js';
import { parsePrefixCommand } from '../utils/prefixParser.js';
import { supportsPrefixExecution, executePrefixCommand, resolvePrefixAccessKey } from '../utils/messageAdapter.js';
import { resolveCommandAlias, resolveSubcommandAlias } from '../config/commands/commandAliases.js';
import { getPrefixRestriction } from '../config/commands/prefixRestrictions.js';
import { getGuildConfig } from '../services/config/guildConfig.js';
import { getCommandPrefix, getBotMessage, isBotOwner, isCommandCategoryEnabled, isMaintenanceMode } from '../config/bot.js';
import { enforceAbuseProtection, formatCooldownDuration } from '../utils/abuseProtection.js';
import { createEmbed } from '../utils/embeds.js';
import { isCommandEnabled } from '../services/commandAccessService.js';
import {
  getCountingGameConfig,
  saveCountingGameConfig,
  isValidCountingMessage,
  recordCorrectCount,
} from '../services/countingGameService.js';

import * as renderModule from '../render.js';
const renderSuggestionCard = renderModule.renderSuggestionCard || renderModule.default;

const MESSAGE_XP_RATE_LIMIT_ATTEMPTS = 12;
const MESSAGE_XP_RATE_LIMIT_WINDOW_MS = 10000;

const SUGGESTION_CHANNEL_ID = '1437792846907183165';
const AUTO_REACT_CHANNEL_ID = '1391737804781916160';
const AUTO_REACT_EMOJI = '🔥';

const TARGET_ROLE_NAME = '𝐃𝐳𝐓𝐩 | 𝐓𝐚𝐞m 𝐃𝐳 𝐓𝐨p';
const LINE_IMAGE_URL = 'https://cdn.discordapp.com/attachments/1391737740789288971/1449912733691809812/standard.gif?ex=6ac23eb5&is=6ac0ed35&hm=91b9851b06536cbe7906c5748649be284e69ed09536d2693baf302e578b78f4f&';

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    try {
      if (message.author.bot || !message.guild) return;

      // 1. الردود التلقائية وأمر السحب
      const autoReplied = await handleAutoReply(message);
      if (autoReplied) return;

      // 2. التفاعل التلقائي بالـ Emoji
      await handleAutoReact(message);

      // 3. نظام بطاقات الاقتراحات بالصور
      if (message.channel.id === SUGGESTION_CHANNEL_ID) {
        await handleSuggestionsCard(message);
        return;
      }

      // 4. إعادة تسمية التذاكر تلقائياً (Tickets)
      await handleTicketAutoRename(message);

      // 5. لعبة الأرقام (Counting Game)
      const countingProcessed = await handleCountingGame(message, client);
      if (countingProcessed) return;

      // 6. تشغيل كافة أوامر البريفكس
      await handlePrefixCommand(message, client);

      // 7. نظام الخبرة واللفلات (Leveling / XP)
      await handleLeveling(message, client);
    } catch (error) {
      logger.error('Error in messageCreate event:', error);
    }
  }
};

async function handleAutoReply(message) {
  const content = message.content.toLowerCase().trim();
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // أمر السحب المباشر !pull
  if (command === '!pull' || command === 'سحب') {
    const hasRole = message.member?.roles.cache.some(role => role.name === TARGET_ROLE_NAME);
    const isAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator);

    if (!hasRole && !isAdmin) {
      await message.reply('❌ ليس لديك الصلاحية لاستعمال هذا الأمر.').catch(() => {});
      return true;
    }

    const targetMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!targetMember) {
      await message.reply('❌ يرجى منشن الشخص المراد سحبه.').catch(() => {});
      return true;
    }

    if (!targetMember.voice.channel) {
      await message.reply('❌ العضو غير متواجد في أي روم صوتي.').catch(() => {});
      return true;
    }

    const authorChannel = message.member.voice.channel;
    if (!authorChannel) {
      await message.reply('❌ يجب أن تكون متواجدًا في روم صوتي أولاً لسحبه إليك.').catch(() => {});
      return true;
    }

    await targetMember.voice.setChannel(authorChannel).catch(() => {});
    await message.reply(`✅ تم سحب <@${targetMember.id}> إلى **${authorChannel.name}**.`);
    return true;
  }

  // الردود التلقائية
  if (content === 'خط') {
    await message.channel.send({ files: [LINE_IMAGE_URL] }).catch(() => {});
    return true;
  }

  if (content === 'fayt') {
    await message.reply('**Server IP:** `pr.sampdroid.app:7777`').catch(() => {});
    return true;
  }

  if (content === 'ip' || content === 'الابي' || content === 'اي بي' || content === 'الاي بي') {
    await message.reply('**Server IP:** `144.217.62.159:7777`').catch(() => {});
    return true;
  }

  if (content === 'السلام عليكم') {
    await message.reply('وعليكم السلام ورحمة الله وبركاته! 🌸').catch(() => {});
    return true;
  }

  if (content === 'رابط السيرفر' || content === 'سيرفر') {
    await message.reply('تفضل رابط السيرفر: https://discord.gg/CdGddfWQZq').catch(() => {});
    return true;
  }

  if (content === 'يوتيوب' || content === 'قناة') {
    await message.reply('تفضل رابط القناة: https://youtube.com/@top_labowi?si=HVHztrz000000000').catch(() => {});
    return true;
  }

  return false;
}

async function handleSuggestionsCard(message) {
  try {
    const content = message.content;
    const authorUsername = message.author.username;
    const avatarUrl = message.author.displayAvatarURL({ extension: 'png', size: 256 });

    await message.delete().catch(() => {});

    if (typeof renderSuggestionCard !== 'function') {
      logger.error('renderSuggestionCard is not a function. Check exports in render.js');
      return;
    }

    const imageBuffer = await renderSuggestionCard({
      username: authorUsername,
      avatarUrl: avatarUrl,
      suggestion: content
    });

    const attachment = new AttachmentBuilder(imageBuffer, { name: 'suggestion.png' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('upvote')
        .setLabel('0')
        .setEmoji('1555969922188845118')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('downvote')
        .setLabel('0')
        .setEmoji('1555969894846304458')
        .setStyle(ButtonStyle.Secondary)
    );

    const suggestionMessage = await message.channel.send({
      files: [attachment],
      components: [row]
    });

    const thread = await suggestionMessage.startThread({
      name: `نقاش - ${authorUsername}`,
      autoArchiveDuration: 1440
    });

    await thread.send('شكراً على اقتراحك ❤️ | هنا يمكن النقاش في الاقتراح.');
  } catch (error) {
    logger.error('Error rendering suggestion card:', error);
  }
}

async function handleTicketAutoRename(message) {
  try {
    const channel = message.channel;
    if (!channel.name.toLowerCase().startsWith('ticket-')) return;

    const messages = await channel.messages.fetch({ limit: 15 });
    const userMessages = messages.filter(msg => !msg.author.bot);

    if (userMessages.size === 1) {
      const ticketNumberMatch = channel.name.match(/\d+/);
      const ticketNumber = ticketNumberMatch ? ticketNumberMatch[0] : '';
      const firstWord = message.content.trim().split(/\s+/)[0];
      if (!firstWord) return;

      const cleanWord = firstWord.replace(/[^\w\u0600-\u06FF-]/g, '');
      if (cleanWord.length > 0) {
        const newName = ticketNumber ? `${ticketNumber}-${cleanWord}` : cleanWord;
        await channel.setName(newName);
        logger.info(`Ticket renamed to ${newName} by ${message.author.tag}`);
      }
    }
  } catch (error) {
    logger.error('Error changing ticket name:', error);
  }
}

async function handleAutoReact(message) {
  if (message.channel.id === AUTO_REACT_CHANNEL_ID) {
    try {
      await message.react(AUTO_REACT_EMOJI);
    } catch (error) {
      logger.error('Error adding auto reaction:', error);
    }
  }
}

async function handlePrefixCommand(message, client) {
  try {
    const guildConfig = await getGuildConfig(client, message.guild.id);
    const prefix = guildConfig?.prefix || getCommandPrefix();
    const parsed = parsePrefixCommand(message.content, prefix);

    if (!parsed) return;

    let { commandName, args } = parsed;
    const musicPrefixShortcut = commandName.toLowerCase();
    const MUSIC_PREFIX_SHORTCUTS = new Set(['leave', 'pause', 'resume', 'skip', 'stop', 'volume']);
    if (MUSIC_PREFIX_SHORTCUTS.has(musicPrefixShortcut)) {
      commandName = 'music';
      args = [musicPrefixShortcut, ...args];
    }

    const resolvedCommandName = resolveCommandAlias(commandName);
    const command = client.commands.get(resolvedCommandName);

    if (!command) return;

    if (isMaintenanceMode() && !isBotOwner(message.author.id)) {
      await message.channel.send({
        embeds: [createEmbed({
          title: 'Maintenance Mode',
          description: getBotMessage('maintenanceMode'),
          color: 'warning',
        })],
      }).catch(() => {});
      return;
    }

    if (!isCommandCategoryEnabled(command.category)) {
      await message.channel.send({
        embeds: [createEmbed({
          title: 'Feature Disabled',
          description: getBotMessage('commandDisabled'),
          color: 'error',
        })],
      }).catch(() => {});
      return;
    }

    const restriction = getPrefixRestriction(command, args, resolveSubcommandAlias);
    if (!supportsPrefixExecution(command) || restriction.blocked) {
      if (restriction.blocked && restriction.reason) {
        const embed = createEmbed({
          title: 'Slash Command Only',
          description: `${restriction.reason}\nUse \`/${resolvedCommandName}\` instead.`,
          color: 'info',
        });
        await message.channel.send({ embeds: [embed] }).catch(() => {});
      }
      return;
    }

    if (!(await isCommandEnabled(client, message.guild.id, resolvePrefixAccessKey(command.data, args), command.category))) {
      const embed = createEmbed({
        title: 'Command Disabled',
        description: 'This command has been disabled for this server.',
        color: 'error',
      });
      await message.channel.send({ embeds: [embed] }).catch(() => {});
      return;
    }

    const mockInteractionForProtection = { guildId: message.guild.id, user: message.author };
    const abuseProtection = await enforceAbuseProtection(mockInteractionForProtection, command, resolvedCommandName);
    if (!abuseProtection.allowed) {
      const formattedCooldown = formatCooldownDuration(abuseProtection.remainingMs);
      const embed = createEmbed({
        title: 'Command Cooldown',
        description: `This command is on cooldown. Please wait ${formattedCooldown} before trying again.`,
        color: 'error',
      });
      await message.channel.send({ embeds: [embed] }).catch(() => {});
      return;
    }

    await executePrefixCommand(command, message, args, client, prefix, guildConfig);
  } catch (error) {
    logger.error('Error handling prefix command:', error);
  }
}

async function handleCountingGame(message, client) {
  try {
    const config = await getCountingGameConfig(client, message.guild.id);
    if (!config.enabled || !config.channelId || message.channel.id !== config.channelId) {
      return false;
    }

    const content = message.content.trim();
    const validCount = isValidCountingMessage(content, config);
    const invalidAttempt = !validCount || message.author.id === config.lastUserId;

    if (invalidAttempt) {
      await message.delete().catch(() => {});
      await saveCountingGameConfig(client, message.guild.id, {
        ...config,
        nextNumber: 1,
        lastUserId: null,
        currentStreak: 0,
      });

      const failureMessage = await message.channel.send(`❌ Count broken by <@${message.author.id}>. The sequence has been reset to **1**.`);
      setTimeout(() => failureMessage.delete().catch(() => {}), 10000);
      return true;
    }

    await recordCorrectCount(client, message.guild.id, message.author.id);
    return true;
  } catch (error) {
    logger.error('Error handling counting game:', error);
    return false;
  }
}

async function handleLeveling(message, client) {
  try {
    const rateLimitKey = `xp-event:${message.guild.id}:${message.author.id}`;
    const canProcess = await checkRateLimit(rateLimitKey, MESSAGE_XP_RATE_LIMIT_ATTEMPTS, MESSAGE_XP_RATE_LIMIT_WINDOW_MS);
    if (!canProcess) return;

    const levelingConfig = await getLevelingConfig(client, message.guild.id);
    if (!levelingConfig?.enabled || levelingConfig.ignoredChannels?.includes(message.channel.id)) return;

    if (levelingConfig.ignoredRoles?.length > 0) {
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (member && member.roles.cache.some(role => levelingConfig.ignoredRoles.includes(role.id))) return;
    }

    if (levelingConfig.blacklistedUsers?.includes(message.author.id) || !message.content?.trim()) return;

    const userData = await getUserLevelData(client, message.guild.id, message.author.id);
    const cooldownTime = levelingConfig.xpCooldown || 60;
    if (Date.now() - (userData.lastMessage || 0) < cooldownTime * 1000) return;

    const minXP = levelingConfig.xpRange?.min || levelingConfig.xpPerMessage?.min || 15;
    const maxXP = levelingConfig.xpRange?.max || levelingConfig.xpPerMessage?.max || 25;
    const xpToGive = Math.floor(Math.random() * (Math.max(minXP, maxXP) - Math.max(1, minXP) + 1)) + Math.max(1, minXP);

    let finalXP = xpToGive;
    if (levelingConfig.xpMultiplier && levelingConfig.xpMultiplier > 1) {
      finalXP = Math.floor(finalXP * levelingConfig.xpMultiplier);
    }

    await addXp(client, message.guild, message.member, finalXP);
  } catch (error) {
    logger.error('Error handling leveling for message:', error);
  }
}
