module.exports = {
  data: {
    name: "내전개설",
    description: "내전을 개설하여 팀장을 지정합니다",
  },
  async execute(interaction) {
    const teamLeader = interaction.user.username;
    await interaction.reply(
      `${teamLeader}님이 팀장으로 지정되었습니다. 팀에 참여하려면 버튼을 눌러주세요.`
    );

    // 버튼 생성 로직 추가 필요
  },
};
