const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const ongoingMatchesPath = path.join(__dirname, "../data/ongoingMatches.json");

// 진행 중인 내전 데이터 로드
const loadOngoingMatches = () => {
  if (!fs.existsSync(ongoingMatchesPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(ongoingMatchesPath, "utf8"));
};

module.exports = {
  name: "내전목록",
  description: "현재 진행 중인 모든 내전을 확인합니다.",
  async execute(interaction) {
    try {
      // 최신 ongoingMatches 로드
      const ongoingMatches = loadOngoingMatches();
      const matchIds = Object.keys(ongoingMatches);
      const guild = interaction.guild;

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

      for (const matchId of matchIds) {
        const match = ongoingMatches[matchId];
        const team1LeaderName = await guild.members.fetch(match.team1LeaderId)
          .displayName; // 팀장 이름
        const team2LeaderName = await guild.members.fetch(match.team2LeaderId)
          .displayName; // 팀장 이름

        embed.addFields({
          name: `내전 ID: ${matchId}`,
          value: `**내전 이름:** ${match.matchName}\n**팀 1 팀장:** ${team1LeaderName}\n**팀 2 팀장:** ${team2LeaderName}`,
          inline: false,
        });
      }

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
