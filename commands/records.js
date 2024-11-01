const { getSheetClient } = require("../utils/googleSheets");

module.exports = {
  data: {
    name: "전적",
    description: "자신의 승/패 전적을 확인합니다",
  },
  async execute(interaction) {
    const sheetClient = await getSheetClient();
    const playerName = interaction.user.username;

    // Google Sheets에서 전적 가져오기
  },
};
