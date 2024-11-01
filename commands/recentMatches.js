const { getSheetClient } = require("../utils/googleSheets");

module.exports = {
  data: {
    name: "최근내전",
    description: "최근 10개의 내전 기록을 확인합니다",
  },
  async execute(interaction) {
    const sheetClient = await getSheetClient();

    // Google Sheets에서 최근 매치 기록 가져오기
  },
};
