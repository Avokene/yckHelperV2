const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

let ongoingMatches = {}; // 진행 중인 내전 목록
let matchCounter = 1; // 내전 ID 증가를 위한 카운터

module.exports = {
  data: {
    name: "내전개설",
    description: "내전을 개설하여 두 팀장과 내전 이름을 지정합니다",
  },
  async execute(interaction) {
    const args = interaction.options.getString("args"); // 내전 이름, 팀1 팀장, 팀2 팀장 입력 필요
    const [matchName, team1LeaderName, team2LeaderName] = args.split(",");

    if (!matchName || !team1LeaderName || !team2LeaderName) {
      await interaction.reply({
        content: "올바른 형식: 내전이름, 팀1팀장, 팀2팀장을 입력해 주세요.",
        ephemeral: true,
      });
      return;
    }

    const matchId = matchCounter++; // 순차적으로 증가하는 내전 ID 생성
    ongoingMatches[matchId] = {
      matchName,
      team1Leader: team1LeaderName.trim(),
      team2Leader: team2LeaderName.trim(),
      team1: [],
      team2: [],
    };

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`내전 개설: ${matchName}`)
      .setDescription(
        `내전 ID: ${matchId}\n${team1LeaderName}님이 팀 1 팀장, ${team2LeaderName}님이 팀 2 팀장으로 지정되었습니다.\n각 팀에 참여하려면 아래 버튼을 눌러주세요.`
      );

    // 팀 1 (팀장1) / 팀 2 (팀장2) 참가 버튼
    const team1Button = new ButtonBuilder()
      .setCustomId(`join_team1_${matchId}`)
      .setLabel(`${team1LeaderName}님의 팀에 참가하기`)
      .setStyle(ButtonStyle.Primary);

    const team2Button = new ButtonBuilder()
      .setCustomId(`join_team2_${matchId}`)
      .setLabel(`${team2LeaderName}님의 팀에 참가하기`)
      .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder().addComponents(
      team1Button,
      team2Button
    );

    await interaction.reply({ embeds: [embed], components: [actionRow] });

    const filter = (btnInteraction) =>
      btnInteraction.customId === `join_team1_${matchId}` ||
      btnInteraction.customId === `join_team2_${matchId}`;

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 600000,
    }); // 10분 동안 수집

    collector.on("collect", async (btnInteraction) => {
      const userName = btnInteraction.user.username;
      const currentMatch = ongoingMatches[matchId];

      if (btnInteraction.customId === `join_team1_${matchId}`) {
        if (currentMatch.team1.includes(userName)) {
          await btnInteraction.reply({
            content: "이미 팀 1에 참가한 상태입니다.",
            ephemeral: true,
          });
        } else if (currentMatch.team2.includes(userName)) {
          await btnInteraction.reply({
            content: "이미 팀 2에 참가한 상태입니다.",
            ephemeral: true,
          });
        } else {
          currentMatch.team1.push(userName);
          await btnInteraction.reply({
            content: `${userName}님이 ${team1LeaderName}님의 팀에 참가했습니다!`,
            ephemeral: true,
          });
        }
      } else if (btnInteraction.customId === `join_team2_${matchId}`) {
        if (currentMatch.team2.includes(userName)) {
          await btnInteraction.reply({
            content: "이미 팀 2에 참가한 상태입니다.",
            ephemeral: true,
          });
        } else if (currentMatch.team1.includes(userName)) {
          await btnInteraction.reply({
            content: "이미 팀 1에 참가한 상태입니다.",
            ephemeral: true,
          });
        } else {
          currentMatch.team2.push(userName);
          await btnInteraction.reply({
            content: `${userName}님이 ${team2LeaderName}님의 팀에 참가했습니다!`,
            ephemeral: true,
          });
        }
      }
    });

    collector.on("end", async () => {
      await interaction.followUp(
        `내전 ${matchName} (${matchId})의 참가 시간이 만료되었습니다.`
      );
      delete ongoingMatches[matchId]; // 내전 데이터 삭제
    });
  },
};
