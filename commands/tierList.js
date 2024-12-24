const { readFromSheet } = require("../utils/googleSheets"); // Google Sheets 읽기 함수
const hasAdminPermission = require("../utils/checkAdmin"); // 관리자 권한 확인 함수

module.exports = {
  name: "티어표",
  description:
    "시즌 승/패의 합이 많은 순으로 티어표를 보여줍니다. (관리자 전용)",
  async execute(interaction) {
    try {
      // 관리자 권한 확인
      if (!hasAdminPermission(interaction)) {
        await interaction.reply({
          content: "❌ 이 명령어는 관리자만 사용할 수 있습니다.",
          ephemeral: true,
        });
        return;
      }

      // Google Sheets 데이터 가져오기
      const range = "STATS!A2:G"; // 전적 데이터 범위
      const sheetData = await readFromSheet(range);

      if (!sheetData || sheetData.length === 0) {
        await interaction.reply({
          content: "❌ 전적 데이터가 없습니다.",
          ephemeral: true,
        });
        return;
      }

      // 데이터 정렬 (시즌 승 + 시즌 패 기준으로 내림차순)
      const sortedData = sheetData
        .map((row) => ({
          name: row[1], // displayName
          winsSeason: parseInt(row[5]) || 0, // 시즌 승
          lossesSeason: parseInt(row[6]) || 0, // 시즌 패
          wins: parseInt(row[3]) || 0, // 전체 승
          losses: parseInt(row[4]) || 0, // 전체 패
        }))
        .sort(
          (a, b) =>
            b.winsSeason + b.lossesSeason - (a.winsSeason + a.lossesSeason)
        );

      // 결과 문자열 생성
      let tierListMessage =
        "🏆 **티어표**\n시즌 승/패의 합이 많은 순으로 정렬된 티어표입니다:\n\n";

      sortedData.forEach((player, index) => {
        tierListMessage += `${index + 1}. ${player.name} - 시즌: ${
          player.winsSeason
        }승 / ${player.lossesSeason}패, 전체: ${player.wins}승 / ${
          player.losses
        }패\n`;
      });

      await interaction.reply(tierListMessage);
    } catch (error) {
      console.error("Error generating tier list:", error);
      await interaction.reply({
        content: "티어표를 불러오는 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
