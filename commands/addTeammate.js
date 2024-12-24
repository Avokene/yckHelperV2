const { EmbedBuilder } = require("discord.js");
let ongoingMatches = require("../utils/ongoingMatches"); // 진행 중인 내전 데이터 가져오기

module.exports = {
  name: "팀원추가",
  description: "수동추가.",
  options: [
    {
      name: "match_id",
      type: 4, // INTEGER
      description: "내전 ID를 입력하세요.",
      required: true,
    },
    {
      name: "user",
      type: 6, // USER
      description: "추가할 사용자를 선택하세요.",
      required: true,
    },
    {
      name: "team",
      type: 4, // INTEGER
      description: "추가할 팀 번호를 입력하세요 (1 또는 2).",
      required: true,
      choices: [
        { name: "Team 1", value: 1 },
        { name: "Team 2", value: 2 },
      ],
    },
  ],
  async execute(interaction) {
    try {
      const matchId = interaction.options.getInteger("match_id");
      const user = interaction.options.getUser("user");
      const team = interaction.options.getInteger("team");

      // 진행 중인 내전 확인
      const match = ongoingMatches[matchId];
      if (!match) {
        await interaction.reply({
          content: `❌ 내전 ID ${matchId}에 해당하는 진행 중인 내전을 찾을 수 없습니다.`,
          ephemeral: true,
        });
        return;
      }

      // 사용자가 이미 다른 팀에 있는지 확인
      const userName = user.username;
      if (match.team1.includes(userName) || match.team2.includes(userName)) {
        await interaction.reply({
          content: `❌ ${userName}님은 이미 다른 팀에 참가한 상태입니다.`,
          ephemeral: true,
        });
        return;
      }

      // 팀에 사용자 추가
      if (team === 1) {
        match.team1.push(userName);
      } else if (team === 2) {
        match.team2.push(userName);
      } else {
        await interaction.reply({
          content: "❌ 유효하지 않은 팀 번호입니다. 1 또는 2를 선택하세요.",
          ephemeral: true,
        });
        return;
      }

      // 응답 메시지
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(`✅ ${userName}님이 팀 ${team}에 추가되었습니다.`)
        .setDescription(
          `**내전 이름:** ${match.matchName}\n` +
            `**팀 1 인원:** ${match.team1.join(", ") || "없음"}\n` +
            `**팀 2 인원:** ${match.team2.join(", ") || "없음"}`
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error adding teammate:", error);
      await interaction.reply({
        content: "팀원 추가 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
