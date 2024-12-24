module.exports = {
  name: "도움말",
  description: "명령어 설명을 표시합니다.",
  async execute(interaction) {
    const helpMessage = `📜 **도움말**
  
  - **/티어표**: 시즌 승/패의 합이 많은 순으로 티어표를 보여줍니다. (관리자 전용)
  - **/내전개설**: 내전을 개설합니다.
  - **/내전종료**: 내전을 종료하고 결과를 기록합니다. (관리자 및 팀장 전용)
  - **/전적**: 특정 유저의 전적을 확인합니다.
  - **/내전목록**: 현재 진행 중인 내전 목록을 확인합니다.
  - **/팀**: 특정 내전의 팀 구성을 확인합니다.`;

    await interaction.reply(helpMessage);
  },
};
