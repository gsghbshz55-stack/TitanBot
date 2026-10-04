import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tax')
    .setDescription('حساب ضريبة البوت والوسيط بدقة عالية')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('المبلغ المراد حساب ضريبته')
        .setRequired(true)
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    // حساب ضريبة بروبوت القياسية (المبلغ * 20 / 19)
    const taxPro = Math.floor(amount * 20 / 19);
    
    // نسبة الوسيط (مثلاً 2%)
    const mediatorFee = Math.floor(amount * 0.02);
    
    // إجمالي الضريبة مع نسبة الوسيط
    const totalWithAll = taxPro + mediatorFee;

    const taxEmbed = new EmbedBuilder()
      .setColor('#ff334b') // لون أحمر متناسق مع إمبد الفيدباك
      .setAuthor({
        name: interaction.guild.name,
        iconURL: interaction.guild.iconURL({ dynamic: true })
      })
      .setDescription(`
• **المبلغ:** \`${amount.toLocaleString()}\`
• **ضريبة بروبوت:** \`${taxPro.toLocaleString()}\`
• **المبلغ كامل مع ضريبة الوسيط:** \`${(taxPro + mediatorFee).toLocaleString()}\`
• **نسبة الوسيط (2%):** \`${mediatorFee.toLocaleString()}\`
• **الضريبة كاملة مع نسبة الوسيط:** \`${totalWithAll.toLocaleString()}\`
      `)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    // أزرار سفلية مطابقة للتصميم المطلوب
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('tax_btn')
        .setLabel('Tax')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('mediator_btn')
        .setLabel('Mediator')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await interaction.reply({
      embeds: [taxEmbed],
      components: [row]
    });
  },
};
