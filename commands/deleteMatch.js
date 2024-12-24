const { EmbedBuilder } = require("discord.js");
const ongoingMatches = require("../utils/onGoingMatches"); // 진행 중인 내전 데이터 가져오기
const hasAdminPermission = require("../utils/checkAdmin"); // 관리자 권한 확인 함수

module.exports = {
  name: "내전삭제",
  description: "진행 중인 내전을 삭제합니다. (관리자 전용)",
  options: [
    {
      name: "match_id",
      type: 4, // INTEGER
      description: "삭제할 내전의 ID를 입력하세요.",
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

      // 진행 중인 내전 확인
      const match = ongoingMatches[matchId];
      if (!match) {
        await interaction.reply({
          content: `❌ 내전 ID ${matchId}에 해당하는 진행 중인 내전을 찾을 수 없습니다.`,
          ephemeral: true,
        });
        return;
      }

      // 내전 삭제
      delete ongoingMatches[matchId];

      // 성공 메시지
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🛑 내전 삭제 완료")
        .setDescription(
          `**내전 ID:** ${matchId}\n` +
            `**내전 이름:** ${match.matchName}\n` +
            `이 내전은 삭제되었습니다.`
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error deleting match:", error);
      await interaction.reply({
        content: "내전 삭제 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
