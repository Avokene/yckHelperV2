const { EmbedBuilder } = require("discord.js");
const { writeToSheet } = require("../utils/googleSheets"); // Google Sheets 기록 함수
const ongoingMatches = require("../utils/onGoingMatches"); // 진행 중인 내전 데이터 가져오기
const hasAdminPermission = require("../utils/checkAdmin"); // 관리자 권한 확인 함수

module.exports = {
  name: "내전종료",
  description:
    "내전을 종료하고 결과를 기록합니다. 관리자 권한이 있는 사용자나 지정된 ID는 승리 팀을 지정할 수 있습니다.",
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
      const matchId = interaction.options.getInteger("match_id");
      const winningTeamOption = interaction.options.getInteger("winning_team");
      const userId = interaction.user.id;

      // 진행 중인 내전 확인
      const match = ongoingMatches[matchId];
      if (!match) {
        await interaction.reply({
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
          await interaction.reply({
            content:
              "❌ 이 명령어는 팀장만 사용할 수 있습니다. (관리자는 승리 팀을 지정할 수 있습니다.)",
            ephemeral: true,
          });
          return;
        }
      }

      // 팀원 정보 구성
      const team1Members = match.team1.map((member) => member);
      const team2Members = match.team2.map((member) => member);

      // 전적 업데이트
      const winningTeamMembers =
        winningTeam === "팀1" ? team1Members : team2Members;
      const losingTeamMembers =
        winningTeam === "팀1" ? team2Members : team1Members;

      await Promise.all([
        ...winningTeamMembers.map(
          async (member) => updateStats(member.id, true) // 승리 업데이트
        ),
        ...losingTeamMembers.map(
          async (member) => updateStats(member.id, false) // 패배 업데이트
        ),
      ]);

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

      await writeToSheet("RECORDS!A2:F", matchData); // Google Sheets 범위 지정

      // 내전 종료 메시지
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(`✅ 내전 ${match.matchName} 종료!`)
        .setDescription(
          `**내전 ID:** ${matchId}\n` +
            `**승리 팀:** ${winningTeam} (${
              winningTeam === "팀1" ? match.team1Leader : match.team2Leader
            })\n` +
            `**팀 1 인원:** ${team1Members || "없음"}\n` +
            `**팀 2 인원:** ${team2Members || "없음"}`
        );

      await interaction.reply({ embeds: [embed] });

      // 내전 데이터 삭제
      delete ongoingMatches[matchId];
    } catch (error) {
      console.error("Error ending match:", error);
      await interaction.reply({
        content: "내전 종료 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
