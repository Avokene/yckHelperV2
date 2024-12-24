const { google } = require("googleapis");
const sheets = google.sheets("v4");
const credentials = require("../keys/axial-feat-432809-k6-0e527d209714.json");
//Sheet ID from .env
const SHEET_ID = process.env.SHEET_ID;

async function getSheetClient() {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

module.exports = { getSheetClient };
