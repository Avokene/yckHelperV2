const cron = require("node-cron");
const {
  getSheetClient,
  readFromSheet,
  updateSheet,
} = require("./utils/googleSheets");

async function resetSeasonStats() {
  try {
    // Google Sheets 데이터 가져오기
    const range = "STATS!A2:E"; // 전적 데이터 범위
    const sheetData = await readFromSheet(range);

    if (!sheetData || sheetData.length === 0) {
      console.log("No data found to reset.");
      return;
    }

    // 시즌 승/패 데이터 초기화
    const updatedData = sheetData.map((row) => {
      row[5] = 0; // 시즌 승리 초기화 (6번째 열)
      row[6] = 0; // 시즌 패배 초기화 (7번째 열)
      return row;
    });

    // Google Sheets 업데이트
    await updateSheet("Sheet1!A2:G", updatedData);
    console.log("Season stats reset successfully.");
  } catch (error) {
    console.error("Error resetting season stats:", error);
  }
}

// 매월 1일 오전 8시에 실행
cron.schedule("0 8 1 * *", resetSeasonStats, {
  timezone: "Asia/Seoul", // 한국 시간대 설정
});
