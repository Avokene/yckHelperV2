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

  let rows = response.data.values;
  let updated = false;

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
      updated = true;
      break;
    }
  }

  if (!updated) {
    console.warn("User not found in stats sheet:", userId);
  }

  // 업데이트된 데이터 다시 저장
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    resource: { values: rows },
  });
}

async function batchUpdateStats(team1, team2, winningTeam, interaction) {
  const sheets = await getSheetClient();
  const range = "STATS!A:G"; // 전적 데이터 범위

  // Google Sheets 데이터 가져오기
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  let rows = response.data.values;
  const allUsers = [...team1, ...team2];

  for (const userId of allUsers) {
    let userRowIndex = -1;

    // STATS 테이블에서 유저 ID를 검색
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][2] == userId) {
        userRowIndex = i;
        break;
      }
    }

    if (userRowIndex === -1) {
      // 새로운 유저 발견: Discord에서 닉네임 가져오기
      let displayName = "Unknown"; // 기본값
      try {
        const member = await interaction.guild.members.fetch(userId);
        displayName = member ? member.displayName : "Unknown"; // 닉네임 설정
      } catch (error) {
        console.warn(`유저 ID ${userId}의 닉네임을 불러올 수 없습니다.`);
      }

      // 신규 유저 추가
      const newUserRow = [
        (rows.length + 1).toString(), // 새로운 ID (행 번호 사용)
        displayName, // Discord 닉네임
        userId, // Discord ID
        "0", // 총 승
        "0", // 총 패
        "0", // 시즌 승
        "0", // 시즌 패
      ];
      rows.push(newUserRow);
      userRowIndex = rows.length - 1; // 새로 추가된 유저의 인덱스
    }

    // 기존 유저 전적 업데이트
    if (userRowIndex !== -1) {
      const wins = parseInt(rows[userRowIndex][3]) || 0;
      const losses = parseInt(rows[userRowIndex][4]) || 0;
      const winsSeason = parseInt(rows[userRowIndex][5]) || 0;
      const lossesSeason = parseInt(rows[userRowIndex][6]) || 0;

      if (winningTeam === "팀1" && team1.includes(userId)) {
        rows[userRowIndex][3] = (wins + 1).toString();
        rows[userRowIndex][5] = (winsSeason + 1).toString();
      } else if (winningTeam === "팀2" && team2.includes(userId)) {
        rows[userRowIndex][3] = (wins + 1).toString();
        rows[userRowIndex][5] = (winsSeason + 1).toString();
      } else {
        rows[userRowIndex][4] = (losses + 1).toString();
        rows[userRowIndex][6] = (lossesSeason + 1).toString();
      }
    }
  }

  // 업데이트된 데이터 저장
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    resource: { values: rows },
  });

  console.log(`Updated stats for users: ${allUsers.join(", ")}`);
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
  let updated = false;

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
      updated = true;
      break;
    }
  }

  if (!updated) {
    console.warn("User not found in stats sheet:", userId);
  }

  // 업데이트된 데이터 다시 저장
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    resource: { values: rows },
  });
}

async function batchRevokeStats(team1, team2, winningTeam) {
  const sheets = await getSheetClient();
  const range = "STATS!A:G"; // 전적 데이터 범위

  // Google Sheets 데이터 가져오기
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  let rows = response.data.values;

  // 팀 1과 팀 2 업데이트
  const allUsers = [...team1, ...team2];

  allUsers.forEach((userId) => {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][2] == userId) {
        // user_id와 매칭
        const wins = parseInt(rows[i][3]) || 0;
        const losses = parseInt(rows[i][4]) || 0;
        const winsSeason = parseInt(rows[i][5]) || 0;
        const lossesSeason = parseInt(rows[i][6]) || 0;

        // 승리 팀 및 패배 팀 업데이트 복구
        if (winningTeam === "팀1" && team1.includes(userId)) {
          rows[i][3] = (wins - 1).toString(); // 전체 승리 복구
          rows[i][5] = (winsSeason - 1).toString(); // 시즌 승리 복구
        } else if (winningTeam === "팀2" && team2.includes(userId)) {
          rows[i][3] = (wins - 1).toString();
          rows[i][5] = (winsSeason - 1).toString();
        } else {
          rows[i][4] = (losses - 1).toString(); // 전체 패배 복구
          rows[i][6] = (lossesSeason - 1).toString(); // 시즌 패배 복구
        }

        break; // 현재 사용자 업데이트 완료
      }
    }
  });

  // 업데이트된 데이터 저장
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    resource: { values: rows },
  });

  console.log(`Reverted stats for users: ${allUsers.join(", ")}`);
}

async function addUserRecord(userId, displayName) {
  const newRecord = ["", displayName, userId, 0, 0, 0, 0]; // ID, 이름, 시즌승, 시즌패, 총승, 총패
  await appendToSheet("STATS", newRecord); // Google Sheets의 STATS 시트에 추가
}

// 리그전 점수를 가져오는 함수
async function getUserScore(userId) {
  const sheets = await getSheetClient();
  const range = "STATS!A:H"; // SCORE 탭에서 ID와 점수 가져오기

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  const rows = response.data.values || [];

  // 첫 번째 행(헤더)을 제외하고 검색
  const userRecord = rows.slice(1).find((row) => row[2] == userId); // A열에 ID가 있다고 가정

  return userRecord ? userRecord[7] : null; // 점수가 없으면 null 반환
}

// STATS 시트에서 모든 사용자 전적 가져오는 함수
async function getAllUserRecords() {
  const sheets = await getSheetClient();
  const range = "STATS!A:G"; // STATS 시트의 전체 데이터 가져오기

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  const rows = response.data.values || [];

  if (rows.length < 2) return []; // 데이터가 없으면 빈 배열 반환

  return rows.slice(1).map((row) => ({
    id: row[0],
    name: row[1],
    userId: row[2],
    wins: row[3] || "0",
    losses: row[4] || "0",
    winsSeason: row[5] || "0",
    lossesSeason: row[6] || "0",
  }));
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
  batchUpdateStats,
  batchRevokeStats,
  addUserRecord,
  getUserScore,
  getAllUserRecords,
};
