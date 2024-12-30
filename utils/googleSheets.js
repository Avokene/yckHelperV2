const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// 서비스 계정 키 파일 경로
const KEY_FILE_PATH = path.join(__dirname, "../keys", "google_service.json");

// 인증 설정
const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Google Sheets 클라이언트 생성 함수
async function getSheetClient() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

const SHEET_ID = process.env.SHEET_ID;

// 데이터 읽기 함수
async function readFromSheet(range) {
  const sheets = await getSheetClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });
  return response.data.values || [];
}

// 데이터 추가 함수 (누적 방식)
async function writeToSheet(range, values) {
  const sheets = await getSheetClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range, // 범위의 시작점 (예: "Sheet1!A:D")
    valueInputOption: "USER_ENTERED", // 입력 방식
    insertDataOption: "INSERT_ROWS", // 기존 데이터를 유지하고 새 행을 추가
    resource: {
      values,
    },
  });
}

// 데이터 삭제 (특정 행)
async function deleteFromSheet(sheetName, rowIndex) {
  const sheets = await getSheetClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: await getSheetId(sheetName), // Sheet 이름을 기반으로 ID 가져오기
              dimension: "ROWS",
              startIndex: rowIndex - 1, // 삭제할 행 (0부터 시작)
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}

// Sheet 이름으로 Sheet ID 가져오는 함수 예제
async function getSheetId(sheetName) {
  const sheets = await getSheetClient();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
  });

  const sheet = spreadsheet.data.sheets.find(
    (s) => s.properties.title == sheetName
  );

  if (!sheet) {
    throw new Error(`Sheet with name "${sheetName}" not found.`);
  }

  return sheet.properties.sheetId;
}

// 데이터 업데이트
async function updateSheet(range, values) {
  const sheets = await getSheetClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    resource: { values },
  });
}

// Discord ID로 데이터 검색
async function searchUserRecordById(userId) {
  const sheets = await getSheetClient();
  const range = "STATS!A:G"; // 데이터 범위 (모든 열 포함)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  const rows = response.data.values || [];
  // 첫 번째 행(헤더)을 제외하고 검색
  const userRecord = rows.slice(1).find((row) => row[2] == userId); // Discord ID가 3번째 열 (user_id)
  if (userRecord) {
    return {
      id: userRecord[0],
      name: userRecord[1],
      userId: userRecord[2],
      wins: userRecord[3],
      losses: userRecord[4],
      winsSeason: userRecord[5],
      lossesSeason: userRecord[6],
    };
  }
  return null; // 데이터가 없으면 null 반환
}

// 전적 업데이트
async function updateStats(userId, isWin) {
  const sheets = await getSheetClient();
  const range = "STATS!A:G"; // 전적 데이터 범위 (전체 데이터)

  // Google Sheets 데이터 가져오기
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  const rows = response.data.values;

  // 사용자 검색 및 업데이트
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][2] == userId) {
      // user_id와 매칭
      const wins = parseInt(rows[i][3]) || 0; // 전체 승리
      const losses = parseInt(rows[i][4]) || 0; // 전체 패배
      const winsSeason = parseInt(rows[i][5]) || 0; // 시즌 승리
      const lossesSeason = parseInt(rows[i][6]) || 0; // 시즌 패배

      if (isWin) {
        rows[i][3] = (wins + 1).toString(); // 전체 승리 증가
        rows[i][5] = (winsSeason + 1).toString(); // 시즌 승리 증가
      } else {
        rows[i][4] = (losses + 1).toString(); // 전체 패배 증가
        rows[i][6] = (lossesSeason + 1).toString(); // 시즌 패배 증가
      }
      break;
    }
  }

  // 업데이트된 데이터 다시 저장
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    resource: { values: rows },
  });
}

async function revokeStats(userId, isWin) {
  const sheets = await getSheetClient();
  const range = "STATS!A2:G"; // 전적 데이터 범위 (전체 데이터)

  // Google Sheets 데이터 가져오기
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  let rows = response.data.values;

  // 사용자 검색 및 업데이트
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][2] == userId) {
      // user_id와 매칭
      const wins = parseInt(rows[i][3]) || 0; // 전체 승리
      const losses = parseInt(rows[i][4]) || 0; // 전체 패배
      const winsSeason = parseInt(rows[i][5]) || 0; // 시즌 승리
      const lossesSeason = parseInt(rows[i][6]) || 0; // 시즌 패배

      if (isWin) {
        rows[i][3] = (wins - 1).toString(); // 전체 승리 감소
        rows[i][5] = (winsSeason - 1).toString(); // 시즌 승리 감소
      } else {
        rows[i][4] = (losses - 1).toString(); // 전체 패배 감소
        rows[i][6] = (lossesSeason - 1).toString(); // 시즌 패배 감소
      }
      break;
    }
  }
  // 업데이트된 데이터 다시 저장
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    resource: { values: rows },
  });
}

module.exports = {
  getSheetClient,
  readFromSheet,
  writeToSheet,
  searchUserRecordById,
  deleteFromSheet,
  updateSheet,
  updateStats,
  revokeStats,
};
