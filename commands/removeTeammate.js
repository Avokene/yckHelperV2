module.exports = {
  data: {
    name: "팀원제거",
    description: "팀에서 팀원을 제거합니다",
  },
  async execute(interaction) {
    const member = interaction.options.getUser("멤버");
    // Google Sheets에서 팀원 제거
  },
};
