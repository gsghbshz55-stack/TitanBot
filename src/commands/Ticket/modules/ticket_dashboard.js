.setTitle('📜 Select Transcript Channel')
                .setDescription('Choose where auto-generated HTML transcripts will be sent when tickets are deleted.')
                .setColor(getColor('info')),
        ],
        components: [new ActionRowBuilder().addComponents(channelSelect)],
        flags: MessageFlags.Ephemeral,
    });

    const collector = rootInteraction.channel.createMessageComponentCollector({
        componentType: ComponentType.ChannelSelect,
        filter: i => i.user.id === selectInteraction.user.id && i.customId === 'ticket_cfg_transcript_channel',
        time: 60_000,
        max: 1,
    });

    collector.on('collect', async channelInteraction => {
        await channelInteraction.deferUpdate();
        const channel = channelInteraction.channels.first();

        guildConfig.ticketTranscriptChannelId = channel.id;
        await setGuildConfig(client, guildId, guildConfig);

        await channelInteraction.followUp({
            embeds: [successEmbed('Transcript Channel Updated', `Ticket transcripts will be saved to ${channel}`)],
            flags: MessageFlags.Ephemeral,
        });

        await refreshDashboard(rootInteraction, guildConfig, guildId, client);
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
            replyUserError(selectInteraction, {
                type: ErrorTypes.RATE_LIMIT,
                message: 'No channel selected. No changes were made.',
            }).catch(() => {});
        }
    });
}

async function handleRepostPanel(btnInteraction, rootInteraction, guildConfig, guildId, client) {
    await btnInteraction.deferUpdate();

    try {
        const sentPanel = await repostTicketPanel(client, rootInteraction.guild, guildConfig, guildId);

        await btnInteraction.followUp({
            embeds: [
                successEmbed(
                    'Panel Reposted',
                    `The ticket panel has been successfully reposted to <#${guildConfig.ticketPanelChannelId}>.`,
                ),
            ],
            flags: MessageFlags.Ephemeral,
        });

        await refreshDashboard(rootInteraction, guildConfig, guildId, client);
    } catch (error) {
        logger.error('Failed to repost ticket panel:', error);
        await replyUserError(btnInteraction, {
            type: ErrorTypes.CONFIGURATION,
            message: `Could not repost the panel: ${error.message}`,
        });
    }
}

async function handleDeleteSystem(btnInteraction, rootInteraction, guildConfig, guildId, client) {
    await btnInteraction.deferUpdate();

    const confirmButton = new ButtonBuilder()
        .setCustomId(`ticket_cfg_confirm_delete_${guildId}`)
        .setLabel('Confirm Reset')
        .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
        .setCustomId(`ticket_cfg_cancel_delete_${guildId}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

    const confirmRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    const confirmMsg = await btnInteraction.followUp({
        embeds: [
            new EmbedBuilder()
                .setTitle('⚠️ Reset Ticket System Configuration')
                .setDescription(
                    'Are you sure you want to reset the ticket system settings?\n\n' +
                    '**Note:** This will clear ticket channels, categories, and roles from the config. Existing ticket channels will not be deleted from the Discord server.',
                )
                .setColor(getColor('danger') || 0xff0000),
        ],
        components: [confirmRow],
        flags: MessageFlags.Ephemeral,
    });

    const collector = confirmMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: i => i.user.id === btnInteraction.user.id,
        time: 30_000,
        max: 1,
    });

    collector.on('collect', async i => {
        await i.deferUpdate();

        if (i.customId === `ticket_cfg_confirm_delete_${guildId}`) {
            delete guildConfig.ticketPanelChannelId;
            delete guildConfig.ticketPanelMessageId;
            delete guildConfig.ticketStaffRoleId;
            delete guildConfig.ticketCategoryId;
            delete guildConfig.ticketClosedCategoryId;
            delete guildConfig.ticketLogsChannelId;
            delete guildConfig.ticketTranscriptChannelId;
            delete guildConfig.ticketPanelMessage;
            delete guildConfig.ticketButtonLabel;

            await setGuildConfig(client, guildId, guildConfig);

            await i.followUp({
                embeds: [
                    successEmbed(
                        'System Configuration Reset',
                        'The ticket system configuration has been completely reset.',
                    ),
                ],
                flags: MessageFlags.Ephemeral,
            });

            await InteractionHelper.safeEditReply(rootInteraction, {
                embeds: [
                    infoEmbed(
                        'Dashboard Closed',
                        'The ticket system setup was cleared. Run `/ticket setup` to reconfigure.',
                    ),
                ],
                components: [],
            }).catch(() => {});
        } else {
            await i.followUp({
                embeds: [infoEmbed('Cancelled', 'Reset action cancelled.')],
                flags: MessageFlags.Ephemeral,
            });
        }
    });
}
