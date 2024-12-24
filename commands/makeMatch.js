const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const ongoingMatches = require("../utils/onGoingMatches"); // 진행 중인 내전 데이터를 공유

let matchCounter = 1; // 내전 ID 증가를 위한 카운터

module.exports = {
  name: "내전개설",
  description: "내전을 개설하여 두 팀장과 내전 이름을 지정합니다.",
  options: [
    {
      name: "name",
      type: 3, // STRING
      description: "내전 이름",
      required: true,
    },
    {
      name: "team1leader",
      type: 6, // USER
      description: "팀 1의 팀장",
      required: true,
    },
    {
      name: "team2leader",
      type: 6, // USER
      description: "팀 2의 팀장",
      required: true,
    },
  ],
  async execute(interaction) {
    try {
      const matchName = interaction.options.getString("name");
      const team1Leader = interaction.options.getUser("team1leader");
      const team2Leader = interaction.options.getUser("team2leader");

      const matchId = matchCounter++; // 순차적으로 증가하는 내전 ID 생성

      // 내전 데이터 저장
      ongoingMatches[matchId] = {
        matchName,
        team1Leader: team1Leader.username,
        team2Leader: team2Leader.username,
        team1: [],
        team2: [],
      };

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`내전 개설: ${matchName}`)
        .setDescription(
          `**내전 ID:** ${matchId}\n` +
            `**팀 1 팀장:** ${team1Leader.username}\n` +
            `**팀 2 팀장:** ${team2Leader.username}\n` +
            `각 팀에 참여하려면 아래 버튼을 눌러주세요.`
        );

      // 팀 참가 버튼 생성
      const team1Button = new ButtonBuilder()
        .setCustomId(`join_team1_${matchId}`)
        .setLabel(`${team1Leader.username}님의 팀에 참가하기`)
        .setStyle(ButtonStyle.Primary);

      const team2Button = new ButtonBuilder()
        .setCustomId(`join_team2_${matchId}`)
        .setLabel(`${team2Leader.username}님의 팀에 참가하기`)
        .setStyle(ButtonStyle.Danger);

      const actionRow = new ActionRowBuilder().addComponents(
        team1Button,
        team2Button
      );

      await interaction.reply({ embeds: [embed], components: [actionRow] });

      // 버튼 클릭 수집
      const filter = (btnInteraction) =>
        btnInteraction.customId === `join_team1_${matchId}` ||
        btnInteraction.customId === `join_team2_${matchId}`;

      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 600000, // 10분
      });

      collector.on("collect", async (btnInteraction) => {
        const guildMember = await interaction.guild.members.fetch(
          btnInteraction.user.id
        );
        const displayName = guildMember.displayName;
        const currentMatch = ongoingMatches[matchId];

        if (btnInteraction.customId === `join_team1_${matchId}`) {
          if (currentMatch.team1.includes(displayName)) {
            await btnInteraction.reply({
              content: "이미 팀 1에 참가한 상태입니다.",
              ephemeral: true,
            });
          } else if (currentMatch.team2.includes(displayName)) {
            await btnInteraction.reply({
              content: "이미 팀 2에 참가한 상태입니다.",
              ephemeral: true,
            });
          } else {
            currentMatch.team1.push(displayName);
            await btnInteraction.reply({
              content: `${displayName}님이 팀 1에 참가했습니다!`,
              ephemeral: true,
            });
          }
        } else if (btnInteraction.customId === `join_team2_${matchId}`) {
          if (currentMatch.team2.includes(displayName)) {
            await btnInteraction.reply({
              content: "이미 팀 2에 참가한 상태입니다.",
              ephemeral: true,
            });
          } else if (currentMatch.team1.includes(displayName)) {
            await btnInteraction.reply({
              content: "이미 팀 1에 참가한 상태입니다.",
              ephemeral: true,
            });
          } else {
            currentMatch.team2.push(displayName);
            await btnInteraction.reply({
              content: `${displayName}님이 팀 2에 참가했습니다!`,
              ephemeral: true,
            });
          }
        }
      });

      collector.on("end", async () => {
        const currentMatch = ongoingMatches[matchId];
        const summary =
          `내전 ${matchName} (${matchId}) 참가 종료!\n` +
          `**팀 1 (${currentMatch.team1Leader}):** ${
            currentMatch.team1.join(", ") || "없음"
          }\n` +
          `**팀 2 (${currentMatch.team2Leader}):** ${
            currentMatch.team2.join(", ") || "없음"
          }`;
        await interaction.followUp(summary);
        delete ongoingMatches[matchId]; // 내전 데이터 삭제
      });
    } catch (error) {
      console.error("Error during match creation:", error);
      await interaction.reply("내전 생성 중 오류가 발생했습니다.");
    }
  },
};
