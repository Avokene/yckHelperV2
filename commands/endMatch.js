const { EmbedBuilder } = require("discord.js");
const { writeToSheet, batchUpdateStats } = require("../utils/googleSheets"); // Google Sheets 기록 함수
const fs = require("fs");
const path = require("path");
const ongoingMatchesPath = path.join(__dirname, "../data/ongoingMatches.json");
const hasAdminPermission = require("../utils/checkAdmin"); // 관리자 권한 확인 함수

// 진행 중인 내전 데이터 로드
const loadOngoingMatches = () => {
  if (!fs.existsSync(ongoingMatchesPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(ongoingMatchesPath, "utf8"));
};

// 진행 중인 내전 데이터 저장
const saveOngoingMatches = (data) => {
  fs.writeFileSync(ongoingMatchesPath, JSON.stringify(data, null, 2));
};

let ongoingMatches = loadOngoingMatches();
console.log("Loaded Ongoing Matches:", ongoingMatches);

module.exports = {
  name: "내전종료",
  description:
    "내전을 종료하고 결과를 기록합니다. 관리자 권한이 있는 사용자나 팀장이 승리 팀을 지정할 수 있습니다.",
  options: [
    {
      name: "match_id",
      type: 4, // INTEGER
      description: "종료할 내전의 ID를 입력하세요.",
      required: true,
    },
    {
      name: "winning_team",
      type: 4, // INTEGER
      description: "승리 팀 번호를 입력하세요 (1 또는 2).",
      required: false,
      choices: [
        { name: "팀 1", value: 1 },
        { name: "팀 2", value: 2 },
      ],
    },
  ],
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true }); // 지연 응답 설정
      ongoingMatches = loadOngoingMatches();
      const matchId = interaction.options.getInteger("match_id").toString();
      const winningTeamOption = interaction.options.getInteger("winning_team");
      const userId = interaction.user.id;

      // 진행 중인 내전 확인
      const match = ongoingMatches[matchId];
      if (!match) {
        await interaction.editReply({
          content: `❌ 내전 ID ${matchId}에 해당하는 진행 중인 내전을 찾을 수 없습니다.`,
          ephemeral: true,
        });
        return;
      }

      let winningTeam = null;

      // 관리자 권한 확인
      const isAdmin = hasAdminPermission(interaction);

      if (winningTeamOption && isAdmin) {
        // 관리자로 승리 팀 지정
        winningTeam = winningTeamOption === 1 ? "팀1" : "팀2";
      } else {
        // 팀장 확인 및 자동 팀 설정
        if (userId === match.team1LeaderId) {
          winningTeam = "팀1";
        } else if (userId === match.team2LeaderId) {
          winningTeam = "팀2";
        }

        if (!winningTeam) {
          await interaction.editReply({
            content:
              "❌ 이 명령어는 팀장만 사용할 수 있습니다. (관리자는 승리 팀을 지정할 수 있습니다.)",
            ephemeral: true,
          });
          return;
        }
      }

      // 팀원 정보 구성
      await batchUpdateStats(match.team1, match.team2, winningTeam);

      // Google Sheets에 결과 기록
      const matchData = [
        [
          matchId,
          team1Members.map((m) => m.displayName).join(", "),
          team1Members.map((m) => m.id).join(", "),
          team2Members.map((m) => m.displayName).join(", "),
          team2Members.map((m) => m.id).join(", "),
          winningTeam,
        ],
      ];

      await writeToSheet("RECORDS!A2:F", matchData);

      // 내전 종료 메시지
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(`✅ 내전 ${match.matchName} 종료!`)
        .setDescription(
          `**내전 ID:** ${matchId}\n` +
            `**승리 팀:** ${winningTeam} (${
              winningTeam === "팀1"
                ? team1Members[0].displayName
                : team2Members[0].displayName
            })\n` +
            `**팀 1 인원:** ${
              team1Members.map((m) => m.displayName).join(", ") || "없음"
            }\n` +
            `**팀 2 인원:** ${
              team2Members.map((m) => m.displayName).join(", ") || "없음"
            }`
        );

      await interaction.editReply({ embeds: [embed] });

      // 내전 데이터 삭제
      delete ongoingMatches[matchId];
      saveOngoingMatches(ongoingMatches);
    } catch (error) {
      console.error("Error ending match:", error);
      await interaction.reply({
        content: "내전 종료 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
