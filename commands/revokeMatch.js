const { EmbedBuilder } = require("discord.js");
const {
  getSheetClient,
  readFromSheet,
  deleteFromSheet,
  batchRevokeStats,
} = require("../utils/googleSheets");
const hasAdminPermission = require("../utils/checkAdmin"); // 관리자 권한 확인 함수

module.exports = {
  name: "내전취소",
  description:
    "잘못 기록된 내전 데이터를 삭제하고 전적을 복구합니다. (관리자 전용)",
  options: [
    {
      name: "match_id",
      type: 4, // INTEGER
      description: "삭제할 내전 ID를 입력하세요.",
      required: true,
    },
  ],
  async execute(interaction) {
    try {
      const matchId = interaction.options.getInteger("match_id");

      // 관리자 권한 확인
      if (!hasAdminPermission(interaction)) {
        await interaction.reply({
          content: "❌ 이 명령어는 관리자만 사용할 수 있습니다.",
          ephemeral: true,
        });
        return;
      }

      // Google Sheets 데이터 가져오기
      const sheets = await getSheetClient();
      const range = "RECORDS!A2:F"; // 데이터가 저장된 범위
      const sheetData = await readFromSheet(range);

      // match_id로 데이터 검색
      const matchIndex = sheetData.findIndex((row) => row[0] == matchId);
      if (matchIndex === -1) {
        await interaction.reply({
          content: `❌ 내전 ID ${matchId}에 해당하는 기록을 찾을 수 없습니다.`,
          ephemeral: true,
        });
        return;
      }

      const [match_id, team1Names, team1Ids, team2Names, team2Ids, winner] =
        sheetData[matchIndex] || [];

      // 데이터 검증
      if (!team1Ids || !team2Ids || !winner) {
        console.log(sheetData[matchIndex]);
        await interaction.reply({
          content: `❌ 내전 ID ${matchId}에 대한 데이터가 불완전합니다. Google Sheets 데이터를 확인하세요.`,
          ephemeral: true,
        });
        return;
      }

      // 팀 멤버 ID 분리
      const team1Members = team1Ids.split(", ").filter((id) => id); // 비어 있는 ID 제외
      const team2Members = team2Ids.split(", ").filter((id) => id); // 비어 있는 ID 제외

      // Google Sheets에서 데이터 삭제
      await deleteFromSheet("RECORDS", matchIndex + 2); // matchIndex는 0부터 시작, 헤더를 고려하여 +2

      // 전적 복구 로직 (team1, team2 데이터를 복구)
      await batchRevokeStats(team1Members, team2Members, winner);

      // 응답 메시지
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(`🛑 내전 기록 취소 완료!`)
        .setDescription(
          `**내전 ID:** ${matchId}\n` +
            `**삭제된 팀 구성:**\n` +
            `**팀 1:** ${team1Names || "없음"}\n` +
            `**팀 2:** ${team2Names || "없음"}\n` +
            `**승리 팀:** ${winner}`
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error revoking match:", error);
      await interaction.reply({
        content: "내전 기록 취소 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
