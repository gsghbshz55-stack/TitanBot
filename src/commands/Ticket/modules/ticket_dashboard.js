import { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    ChannelType, 
    PermissionFlagsBits, 
    MessageFlags 
} from 'discord.js';
import { getGuildConfig, setGuildConfig } from '../../../services/config/guildConfig.js';
import { getColor } from '../../../config/bot.js';

// الإعدادات المباشرة للأرومات
const PANEL_CHANNEL_ID = '1435618260581355603';
const TICKET_CATEGORY_ID = '1398080880236302407';

export default {
    name: 'setup-ticket',
    description: 'إرسال بانل التذاكر وربطه بالروم المحددة',

    /**
     * أمر تثبيت البانل في الروم المحددة
     */
    async execute(interaction, client) {
        const guildId = interaction.guild.id;

        // جلب روم البانل
        const channel = await interaction.guild.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
        if (!channel) {
            return interaction.reply({
                content: `❌ لم يتم العثور على الروم (\`${PANEL_CHANNEL_ID}\`). تحقق من وجودها وصلاحيات البوت.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        // تحديث إعدادات السيرفر
        const guildConfig = await getGuildConfig(client, guildId);
        guildConfig.ticketPanelChannelId = PANEL_CHANNEL_ID;
        guildConfig.ticketCategoryId = TICKET_CATEGORY_ID;

        // بناء Embed البانل والزر
        const panelEmbed = new EmbedBuilder()
            .setTitle('🎫 مركز الدعم الفني | Support Tickets')
            .setDescription('إضغط على الزر في الأسفل لفتح تذكرة جديدة وسيقوم فريق الدعم بمساعدتك.')
            .setColor(getColor('info') || 0x3498db);

        const createBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_create_btn')
                .setLabel('فتح تذكرة')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📩')
        );

        // إرسال البانل وحفظ الرسالة
        const sentPanel = await channel.send({
            embeds: [panelEmbed],
            components: [createBtn],
        });

        guildConfig.ticketPanelMessageId = sentPanel.id;
        await setGuildConfig(client, guildId, guildConfig);

        return interaction.reply({
            content: `✅ تم إرسال البانل بنجاح في <#${PANEL_CHANNEL_ID}> وتخصيص إنشاء التذاكر في الكاتيغوري <#${TICKET_CATEGORY_ID}>!`,
            flags: MessageFlags.Ephemeral,
        });
    },

    /**
     * معالج زر إنشاء التكت (يتم استدعاؤه عند الضغط على الزر)
     */
    async handleButton(interaction) {
        if (interaction.customId !== 'ticket_create_btn') return;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const { guild, user } = interaction;

        // جلب الكاتيغوري
        const category = await guild.channels.fetch(TICKET_CATEGORY_ID).catch(() => null);

        try {
            // إنشاء روم التكت داخل الكاتيغوري
            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                parent: category ? category.id : null,
                permissionOverwrites: [
                    {
                        id: guild.id, // إخفاء الروم عن باقي الأعضاء
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: user.id, // إظهار الروم لصاحب التكت
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.ReadMessageHistory
                        ],
                    },
                ],
            });

            // رسالة الترحيب داخل التكت
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`مرحباً بك ${user.username}`)
                .setDescription('أهلاً بك! يرجى توضيح استفسارك أو مشكلتك هنا وانتظار رد فريق الدعم.')
                .setColor(getColor('success') || 0x2ecc71);

            const closeBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_close_btn')
                    .setLabel('إغلاق التذكرة')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            await ticketChannel.send({
                content: `<@${user.id}>`,
                embeds: [welcomeEmbed],
                components: [closeBtn],
            });

            await interaction.followUp({
                content: `✅ تم إنشاء تذكرتك بنجاح: ${ticketChannel}`,
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            console.error('خطأ أثناء إنشاء التذكرة:', error);
            await interaction.followUp({
                content: '❌ تعذر إنشاء التذكرة. تحقق من صلاحيات البوت (Manage Channels).',
                flags: MessageFlags.Ephemeral,
            });
        }
    }
};
