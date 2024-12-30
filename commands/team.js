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
  name: "팀",
  description: "현재 진행 중인 내전의 팀 구성을 확인합니다.",
  options: [
    {
      name: "match_id",
      type: 4, // INTEGER
      description: "확인할 내전의 ID를 입력하세요.",
      required: true,
    },
  ],
  async execute(interaction) {
    try {
      const ongoingMatches = loadOngoingMatches();
      const matchId = interaction.options.getInteger("match_id").toString();

      // 진행 중인 내전 확인
      const match = ongoingMatches[matchId];
      if (!match) {
        await interaction.reply({
          content: `❌ 내전 ID ${matchId}에 해당하는 진행 중인 내전을 찾을 수 없습니다.`,
          ephemeral: true,
        });
        return;
      }

      // 팀 구성 가져오기
      const team1Members =
        match.team1
          .map(async (member) => {
            let displayName = await interaction.guild.members.fetch(member);
            return displayName;
          })
          .join(", ") || "없음";
      const team2Members =
        match.team2
          .map(async (member) => {
            let displayName = await interaction.guild.members.fetch(member);
            return displayName;
          })
          .join(", ") || "없음";

      // Embed 메시지 생성
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`내전 "${match.matchName}" 팀 구성`)
        .setDescription(`**내전 ID:** ${matchId}`)
        .addFields(
          { name: "팀 1", value: team1Members, inline: true },
          { name: "팀 2", value: team2Members, inline: true }
        )
        .setFooter({ text: "현재 내전 상태를 확인하세요!" });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching team info:", error);
      await interaction.reply({
        content: "내전 팀 구성을 불러오는 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
