module.exports = {
  data: {
    name: "팀원추가",
    description: "팀에 팀원을 추가합니다",
  },
  async execute(interaction) {
    const member = interaction.options.getUser("멤버");
    // Google Sheets에 팀원 추가
  },
};
