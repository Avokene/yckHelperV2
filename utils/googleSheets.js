const { google } = require("googleapis");
const sheets = google.sheets("v4");
const credentials = require("./path/to/credentials.json");

async function getSheetClient() {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

module.exports = { getSheetClient };
