const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const ongoingMatchesPath = path.join(__dirname, "../data/ongoingMatches.json");

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

module.exports = {
  name: "팀원일괄추가",
  description: "수동으로 팀원 4명을 한 번에 추가합니다.",
  options: [
    {
      name: "match_id",
      type: 4, // INTEGER
      description: "내전 ID를 입력하세요.",
      required: true,
    },
    {
      name: "team",
      type: 4, // INTEGER
      description: "추가할 팀 번호를 입력하세요 (1 또는 2).",
      required: true,
      choices: [
        { name: "Team 1", value: 1 },
        { name: "Team 2", value: 2 },
      ],
    },
    {
      name: "user1",
      type: 6, // USER
      description: "추가할 첫 번째 사용자",
      required: true,
    },
    {
      name: "user2",
      type: 6, // USER
      description: "추가할 두 번째 사용자",
      required: true,
    },
    {
      name: "user3",
      type: 6, // USER
      description: "추가할 세 번째 사용자",
      required: true,
    },
    {
      name: "user4",
      type: 6, // USER
      description: "추가할 네 번째 사용자",
      required: true,
    },
  ],
  async execute(interaction) {
    try {
      ongoingMatches = loadOngoingMatches();
      const matchId = interaction.options.getInteger("match_id").toString();
      const team = interaction.options.getInteger("team");

      const userIds = [
        interaction.options.getUser("user1").id,
        interaction.options.getUser("user2").id,
        interaction.options.getUser("user3").id,
        interaction.options.getUser("user4").id,
      ];

      const guild = interaction.guild;

      // 진행 중인 내전 확인
      const match = ongoingMatches[matchId];
      if (!match) {
        await interaction.reply({
          content: `❌ 내전 ID ${matchId}에 해당하는 진행 중인 내전을 찾을 수 없습니다.`,
          ephemeral: true,
        });
        return;
      }

      // 사용자 추가
      const addedUsers = [];
      const alreadyInTeam = [];
      for (const userId of userIds) {
        if (match.team1.includes(userId) || match.team2.includes(userId)) {
          alreadyInTeam.push(userId);
        } else {
          if (team === 1) {
            match.team1.push(userId);
          } else if (team === 2) {
            match.team2.push(userId);
          }
          addedUsers.push(userId);
        }
      }

      // 데이터 저장
      saveOngoingMatches(ongoingMatches);

      // 팀원 목록 Display Name으로 변환
      const team1Names = await Promise.all(
        match.team1.map(async (userId) => {
          const member = await guild.members.fetch(userId);
          return member.displayName;
        })
      );
      const team2Names = await Promise.all(
        match.team2.map(async (userId) => {
          const member = await guild.members.fetch(userId);
          return member.displayName;
        })
      );

      // 응답 메시지 생성
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(`✅ 팀 ${team}에 4명의 사용자가 추가되었습니다.`)
        .setDescription(
          `**내전 이름:** ${match.matchName}\n` +
            `**추가된 사용자:** ${
              addedUsers.length > 0
                ? addedUsers.map((id) => `<@${id}>`).join(", ")
                : "없음"
            }\n` +
            `${
              alreadyInTeam.length > 0
                ? `**이미 다른 팀에 있는 사용자:** ${alreadyInTeam
                    .map((id) => `<@${id}>`)
                    .join(", ")}\n`
                : ""
            }` +
            `**팀 1 인원:** ${team1Names.join(", ") || "없음"}\n` +
            `**팀 2 인원:** ${team2Names.join(", ") || "없음"}`
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error adding teammates:", error);
      await interaction.reply({
        content: "팀원 추가 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
