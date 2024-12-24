const { EmbedBuilder } = require("discord.js");
const { getSheetClient, readFromSheet } = require("../utils/googleSheets"); // Google Sheets 데이터 읽기 함수

module.exports = {
  name: "최근내전",
  description: "최근 10개의 내전 기록을 불러옵니다.",
  async execute(interaction) {
    try {
      // Google Sheets에서 최근 데이터 가져오기
      const range = "RECORDS!A2:F"; // 데이터 범위 (헤더 제외)
      const sheetData = await readFromSheet(range);

      if (!sheetData || sheetData.length === 0) {
        await interaction.reply({
          content: "❌ 기록된 내전 데이터가 없습니다.",
          ephemeral: true,
        });
        return;
      }

      // 최근 10개 기록 추출
      const recentMatches = sheetData.slice(-10).reverse(); // 최신 데이터부터 가져오기

      // Embed 메시지 생성
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("최근 10개 내전 기록")
        .setDescription("최근 내전 결과를 확인하세요:");

      recentMatches.forEach((match, index) => {
        const [matchId, team1Names, team1Ids, team2Names, team2Ids, winner] =
          match;
        embed.addFields({
          name: `내전 ${index + 1} (ID: ${matchId})`,
          value: `**팀 1:** ${team1Names}\n**팀 2:** ${team2Names}\n**승리 팀:** ${winner}`,
        });
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching recent matches:", error);
      await interaction.reply({
        content: "최근 내전 기록을 불러오는 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
