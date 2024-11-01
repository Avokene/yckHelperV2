const { getSheetClient } = require("../utils/googleSheets");

module.exports = {
  data: {
    name: "내전취소",
    description: "최근 내전 기록을 취소합니다",
  },
  async execute(interaction) {
    const sheetClient = await getSheetClient();

    // Google Sheets에서 마지막 기록 삭제
  },
};
