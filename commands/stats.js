const { searchUserRecordById, getUserScore } = require("../utils/googleSheets");

module.exports = {
  name: "전적", // 명령어 이름
  description: "전적을 확인합니다.", // 명령어 설명
  options: [
    {
      name: "user",
      type: 6, // USER
      description: "전적을 검색할 사용자를 선택하세요.",
      required: false, // 필수 입력 아님
    },
  ],
  async execute(interaction) {
    try {
      const targetUser =
        interaction.options.getUser("user") || interaction.user;
      const guildMember = await interaction.guild.members.fetch(targetUser.id); // 서버 멤버 정보 가져오기
      const displayName = guildMember.displayName; // 서버 Display Name 가져오기

      // Google Sheets에서 전적 검색
      const record = await searchUserRecordById(targetUser.id);
      // Google Sheets에서 score 정보 검색
      const score = await getUserScore(targetUser.id);

      if (record) {
        let replyMessage =
          `📊 **${displayName}님의 전적**\n` +
          `\`\`\`yaml\n` +
          `시즌승: ${record.winsSeason}\n` +
          `시즌패: ${record.lossesSeason}\n` +
          `승: ${record.wins}\n` +
          `패: ${record.losses}\n`;

        // score 정보가 존재할 경우 추가
        if (score !== null) {
          replyMessage += `리그전 점수: ${score}\n`;
        }

        replyMessage += `\`\`\``;

        await interaction.reply(replyMessage); // 검색 결과 응답
      } else {
        await interaction.reply(
          `❌ ${displayName}님의 전적을 찾을 수 없습니다.`
        );
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      await interaction.reply("전적을 불러오는 중 오류가 발생했습니다.");
    }
  },
};
