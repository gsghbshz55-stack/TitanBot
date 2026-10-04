import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} from 'discord.js';

// تخزين ألعاب الروليت الشغالة لكل روم
const activeGames = new Map();

export default {
  name: 'roulette',
  aliases: ['روليت', 'تدوير'],
  category: 'fun',
  description: 'نظام روليت الفعاليات الاحترافي مع أرقام واستبعاد',

  async execute(message, args, client) {
    const command = args[0]?.toLowerCase();

    // 1. أمر التدوير لاستبعاد لاعب (للإدارة فقط)
    if (command === 'spin' || message.content.includes('تدوير')) {
      const game = activeGames.get(message.channel.id);
      if (!game) {
        return message.reply('❌ لا توجد لعبة روليت قائمة في هذا الروم حالياً.').catch(() => {});
      }

      const activePlayers = Array.from(game.players.entries()).filter(([_, p]) => p !== null);
      if (activePlayers.length <= 1) {
        return message.reply('⚠️ يجب أن يكون هناك أكثر من لاعب لبدء التدوير.').catch(() => {});
      }

      // اختيار لاعب عشوائي من المتواجدين
      const [chosenNum, chosenUser] = activePlayers[Math.floor(Math.random() * activePlayers.length)];

      const spinEmbed = new EmbedBuilder()
        .setTitle('🎰 نتائج تدوير العجلة!')
        .setDescription(`وقع الاختيار على صاحب الرقم **[ ${chosenNum} ]** وهو: <@${chosenUser.id}>\n\n👉 قم باختيار رقم اللاعب الذي تريد طرده من اللعبة!`)
        .setColor('#2b2d31');

      return message.channel.send({ content: `<@${chosenUser.id}>`, embeds: [spinEmbed] }).catch(() => {});
    }

    // 2. أمر إنشاء لعبة روليت جديدة
    if (activeGames.has(message.channel.id)) {
      return message.reply('⚠️ هناك لعبة روليت قائمة بالفعل في هذا الروم!').catch(() => {});
    }

    const MAX_PLAYERS = 20;
    const players = new Map();
    for (let i = 1; i <= MAX_PLAYERS; i++) players.set(i, null);

    // دالة لتوليد نص قائمة اللاعبين بنفس شكل الصورة
    const generatePlayerList = () => {
      let listText = '';
      let joinedCount = 0;
      for (let i = 1; i <= MAX_PLAYERS; i++) {
        const user = players.get(i);
        if (user) {
          joinedCount++;
          listText += `**${i}** : <@${user.id}>\n`;
        } else {
          listText += `**${i}** : \n`;
        }
      }
      return { listText, joinedCount };
    };

    // دالة لتوليد الإمبد الرئيسي
    const generateEmbed = () => {
      const { listText, joinedCount } = generatePlayerList();
      return new EmbedBuilder()
        .setTitle('روليت')
        .setDescription(
          `**طريقة اللعب:**\n` +
          `1- اختر الرقم الذي سيمثلك في اللعبة\n` +
          `2- ستبدأ الجولة الأولى ويتم تدوير العجلة واختيار لاعب عشوائي\n` +
          `3- إذا كنت اللاعب المختار، ستختار لاعباً من اختيارك ليتم طرده من اللعبة\n` +
          `4- يُطرد اللاعب ونبدأ جولة جديدة، عندما يتكرر جميع اللاعبين ويبقى لاعبان فقط، تدور العجلة ويكون اللاعب المختار هو الفائز باللعبة\n\n` +
          `**أرقام اللاعبين (${joinedCount}/${MAX_PLAYERS})**\n\n` +
          `${listText}`
        )
        .setColor('#111111');
    };

    // دالة لتوليد أزرار الأرقام (5 أزرار في كل صف)
    const generateButtons = () => {
      const rows = [];
      for (let r = 0; r < 4; r++) {
        const row = new ActionRowBuilder();
        for (let i = 1; i <= 5; i++) {
          const num = r * 5 + i;
          const isTaken = players.get(num) !== null;
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`roulette_num_${num}`)
              .setLabel(`${num}`)
              .setStyle(isTaken ? ButtonStyle.Danger : ButtonStyle.Primary)
              .setDisabled(isTaken)
          );
        }
        rows.push(row);
      }
      return rows;
    };

    const initialEmbed = generateEmbed();
    const initialButtons = generateButtons();

    const gameMessage = await message.channel.send({
      embeds: [initialEmbed],
      components: initialButtons,
    });

    activeGames.set(message.channel.id, {
      messageId: gameMessage.id,
      players: players,
    });

    // استقبال ضغطات الأزرار
    const collector = gameMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 600000, // تعمل اللعبة لمدة 10 دقائق
    });

    collector.on('collect', async (interaction) => {
      const selectedNum = parseInt(interaction.customId.replace('roulette_num_', ''));

      // منع العضو من حجز أكثر من رقم واحد
      const alreadyHasNum = Array.from(players.values()).some(p => p?.id === interaction.user.id);
      if (alreadyHasNum) {
        return interaction.reply({ content: '❌ لقد قمت باختيار رقم بالفعل!', flags: 64 });
      }

      // حجز الرقم للاعب
      if (players.get(selectedNum) === null) {
        players.set(selectedNum, interaction.user);

        await interaction.update({
          embeds: [generateEmbed()],
          components: generateButtons(),
        });
      } else {
        await interaction.reply({ content: '❌ هذا الرقم محجوز بالفعل!', flags: 64 });
      }
    });

    collector.on('end', () => {
      activeGames.delete(message.channel.id);
    });
  }
};
