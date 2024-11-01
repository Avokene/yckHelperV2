const { getSheetClient } = require("../utils/googleSheets");

module.exports = {
  data: {
    name: "내전종료",
    description: "내전을 종료하고 결과를 기록합니다",
  },
  async execute(interaction) {
    const sheetClient = await getSheetClient();
    const teamLeader = interaction.user.username;
    // 승리 팀 정보 기록 (Google Sheets에 기록)
  },
};
