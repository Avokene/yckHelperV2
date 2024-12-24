const { EmbedBuilder } = require("discord.js");
const ongoingMatches = require("../utils/onGoingMatches"); // 진행 중인 내전 데이터 가져오기

module.exports = {
  name: "내전목록",
  description: "현재 진행 중인 모든 내전을 확인합니다.",
  async execute(interaction) {
    try {
      // 진행 중인 내전 목록 확인
      const matchIds = Object.keys(ongoingMatches);

      if (matchIds.length === 0) {
        await interaction.reply({
          content: "❌ 현재 진행 중인 내전이 없습니다.",
          ephemeral: true,
        });
        return;
      }

      // Embed 메시지 생성
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("현재 진행 중인 내전 목록")
        .setDescription("현재 활성화된 모든 내전 정보를 확인하세요.");

      matchIds.forEach((matchId) => {
        const match = ongoingMatches[matchId];
        embed.addFields({
          name: `내전 ID: ${matchId}`,
          value: `**내전 이름:** ${match.matchName}\n**팀 1 팀장:** ${match.team1Leader}\n**팀 2 팀장:** ${match.team2Leader}`,
          inline: false,
        });
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching match list:", error);
      await interaction.reply({
        content: "내전 목록을 불러오는 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
