const { getAllUserRecords } = require("../utils/googleSheets");

module.exports = {
  name: "시상", // 명령어 이름
  description: "시즌 다전왕, 다승왕, 다패왕을 확인합니다.", // 명령어 설명
  async execute(interaction) {
    try {
      await interaction.deferReply(); // 응답 지연 처리

      // Google Sheets에서 모든 유저 전적 가져오기
      const allRecords = await getAllUserRecords();
      if (!allRecords || allRecords.length === 0) {
        return await interaction.reply("❌ 전적 데이터가 없습니다.");
      }

      // 전적 데이터 정렬을 위한 배열
      let records = allRecords.map((record) => ({
        name: record.name, // 유저 닉네임
        userId: record.userId, // 디스코드 ID
        totalGames: parseInt(record.winsSeason) + parseInt(record.lossesSeason), // 시즌 총 경기 수
        wins: parseInt(record.winsSeason), // 시즌 승리 수
        losses: parseInt(record.lossesSeason), // 시즌 패배 수
      }));

      // 다전왕(총 경기 수 기준)
      records.sort(
        (a, b) => b.totalGames - a.totalGames || b.losses - a.losses
      );
      const championMostGames = records.shift(); // 첫 번째 요소를 다전왕으로 선정

      // 다승왕(승리 수 기준)
      records.sort((a, b) => b.wins - a.wins || b.losses - a.losses);
      const championMostWins = records.shift(); // 다전왕과 중복되지 않은 첫 번째 요소 선정

      // 다패왕(패배 수 기준)
      records.sort((a, b) => b.losses - a.losses);
      const championMostLosses = records.shift(); // 다전왕, 다승왕과 중복되지 않은 첫 번째 요소 선정

      // 메시지 구성
      let resultMessage = `🏆 **시즌 시상** 🏆\n`;
      resultMessage += "```yaml\n";
      resultMessage += `🎖 다전왕: ${championMostGames.name} (${championMostGames.totalGames} 경기)\n`;
      resultMessage += `🏅 다승왕: ${championMostWins.name} (${championMostWins.wins} 승)\n`;
      resultMessage += `🥉 다패왕: ${championMostLosses.name} (${championMostLosses.losses} 패)\n`;
      resultMessage += "```";

      await interaction.editReply(resultMessage);
    } catch (error) {
      console.error("Error fetching season awards:", error);
      await interaction.reply(
        "❌ 시상 정보를 불러오는 중 오류가 발생했습니다."
      );
    }
  },
};
