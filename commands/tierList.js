const { readFromSheet } = require("../utils/googleSheets");
const hasAdminPermission = require("../utils/checkAdmin");

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
      const range = "STATS!A2:G";
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
          winsSeason: parseInt(row[5], 10) || 0, // 시즌 승
          lossesSeason: parseInt(row[6], 10) || 0, // 시즌 패
          wins: parseInt(row[3], 10) || 0, // 전체 승
          losses: parseInt(row[4], 10) || 0, // 전체 패
        }))
        .sort(
          (a, b) =>
            b.winsSeason + b.lossesSeason - (a.winsSeason + a.lossesSeason)
        );

      // 데이터를 나눠서 출력
      const chunkSize = 10; // 한 번에 보여줄 플레이어 수
      let tierListMessages = [];
      for (let i = 0; i < sortedData.length; i += chunkSize) {
        const chunk = sortedData.slice(i, i + chunkSize);
        let message = `🏆 **티어표** (순위 ${i + 1} - ${i + chunk.length})\n\n`;

        chunk.forEach((player, index) => {
          message += `${i + index + 1}. ${player.name} - 시즌: ${
            player.winsSeason
          }승 / ${player.lossesSeason}패, 전체: ${player.wins}승 / ${
            player.losses
          }패\n`;
        });

        tierListMessages.push(message);
      }

      // 순차적으로 메시지 전송
      await interaction.reply(tierListMessages[0]); // 첫 번째 메시지는 reply로 전송
      for (let i = 1; i < tierListMessages.length; i++) {
        await interaction.followUp(tierListMessages[i]); // 나머지는 followUp으로 전송
      }
    } catch (error) {
      console.error("Error generating tier list:", error);
      await interaction.reply({
        content: "티어표를 불러오는 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
