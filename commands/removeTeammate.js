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
  name: "팀원제거",
  description: "팀원을 제거합니다.",
  options: [
    {
      name: "match_id",
      type: 4, // INTEGER
      description: "내전 ID를 입력하세요.",
      required: true,
    },
    {
      name: "user",
      type: 6, // USER
      description: "제거할 사용자를 선택하세요.",
      required: true,
    },
    {
      name: "team",
      type: 4, // INTEGER
      description: "제거할 팀 번호를 입력하세요 (1 또는 2).",
      required: true,
      choices: [
        { name: "Team 1", value: 1 },
        { name: "Team 2", value: 2 },
      ],
    },
  ],
  async execute(interaction) {
    try {
      const matchId = interaction.options.getInteger("match_id");
      const user = interaction.options.getUser("user");
      const team = interaction.options.getInteger("team");

      const guild = interaction.guild;
      const member = await guild.members.fetch(user.id);
      const displayName = member.displayName;

      // 진행 중인 내전 확인
      const match = ongoingMatches[matchId];
      if (!match) {
        await interaction.reply({
          content: `❌ 내전 ID ${matchId}에 해당하는 진행 중인 내전을 찾을 수 없습니다.`,
          ephemeral: true,
        });
        return;
      }

      const userId = user.id;
      let removed = false;

      // 팀 1 또는 팀 2에서 사용자 제거
      if (team === 1) {
        const index = match.team1.indexOf(userId);
        if (index !== -1) {
          match.team1.splice(index, 1); // 팀에서 사용자 제거
          removed = true;
        }
      } else if (team === 2) {
        const index = match.team2.indexOf(userId);
        if (index !== -1) {
          match.team2.splice(index, 1); // 팀에서 사용자 제거
          removed = true;
        }
      } else {
        await interaction.reply({
          content: "❌ 유효하지 않은 팀 번호입니다. 1 또는 2를 선택하세요.",
          ephemeral: true,
        });
        return;
      }

      if (!removed) {
        await interaction.reply({
          content: `❌ ${displayName}님은 팀 ${team}에 참가하고 있지 않습니다.`,
          ephemeral: true,
        });
        return;
      }

      // 데이터 저장
      saveOngoingMatches(ongoingMatches);

      // 팀원 목록 Display Name으로 변환
      const team1Names = await Promise.all(
        match.team1.map(async (userId) => {
          const member = await interaction.guild.members.fetch(userId);
          return member.displayName;
        })
      );
      const team2Names = await Promise.all(
        match.team2.map(async (userId) => {
          const member = await interaction.guild.members.fetch(userId);
          return member.displayName;
        })
      );

      // 응답 메시지
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(`🛑 ${displayName}님이 팀 ${team}에서 제거되었습니다.`)
        .setDescription(
          `**내전 이름:** ${match.matchName}\n` +
            `**팀 1 인원:** ${team1Names.join(", ") || "없음"}\n` +
            `**팀 2 인원:** ${team2Names.join(", ") || "없음"}`
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error removing teammate:", error);
      await interaction.reply({
        content: "팀원 제거 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  },
};
