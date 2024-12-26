const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs"); // JSON 파일 저장용
const path = require("path");
const ongoingMatchesPath = path.join(__dirname, "../data/ongoingMatches.json");
const counterPath = path.join(__dirname, "../data/matchCounter.json");

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

const loadMatchCounter = () => {
  if (!fs.existsSync(counterPath)) {
    return 1; // 초기 값
  }
  return JSON.parse(fs.readFileSync(counterPath, "utf8"));
};

// 카운터 저장
const saveMatchCounter = (counter) => {
  fs.writeFileSync(counterPath, JSON.stringify(counter, null, 2));
};

let ongoingMatches = loadOngoingMatches();
let matchCounter = loadMatchCounter(); // 파일에서 로드

module.exports = {
  name: "내전개설",
  description: "내전을 개설하여 두 팀장과 내전 이름을 지정합니다.",
  options: [
    {
      name: "name",
      type: 3, // STRING
      description: "내전 이름",
      required: true,
    },
    {
      name: "team1leader",
      type: 6, // USER
      description: "팀 1의 팀장",
      required: true,
    },
    {
      name: "team2leader",
      type: 6, // USER
      description: "팀 2의 팀장",
      required: true,
    },
  ],
  async execute(interaction) {
    try {
      const matchName = interaction.options.getString("name");
      const team1Leader = interaction.options.getUser("team1leader");
      const team2Leader = interaction.options.getUser("team2leader");

      const guild = interaction.guild;
      const team1LeaderMember = await guild.members.fetch(team1Leader.id);
      const team2LeaderMember = await guild.members.fetch(team2Leader.id);

      const team1LeaderDisplayName = team1LeaderMember.displayName;
      const team2LeaderDisplayName = team2LeaderMember.displayName;

      const matchId = matchCounter++; // 순차적으로 증가하는 내전 ID 생성
      saveMatchCounter(matchCounter); // 카운터 저장

      // 내전 데이터 저장
      ongoingMatches[matchId] = {
        matchName,
        team1LeaderId: team1Leader.id,
        team2LeaderId: team2Leader.id,
        team1: [], // 팀원 ID 저장
        team2: [], // 팀원 ID 저장
      };
      saveOngoingMatches(ongoingMatches);

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`내전 개설: ${matchName}`)
        .setDescription(
          `**내전 ID:** ${matchId}\n` +
            `**팀 1 팀장:** ${team1LeaderDisplayName}\n` +
            `**팀 2 팀장:** ${team2LeaderDisplayName}\n` +
            `각 팀에 참여하려면 아래 버튼을 눌러주세요.`
        );

      // 팀 참가 버튼 생성
      const team1Button = new ButtonBuilder()
        .setCustomId(`join_team1_${matchId}`)
        .setLabel("팀 1에 참가하기")
        .setStyle(ButtonStyle.Primary);

      const team2Button = new ButtonBuilder()
        .setCustomId(`join_team2_${matchId}`)
        .setLabel("팀 2에 참가하기")
        .setStyle(ButtonStyle.Danger);

      const actionRow = new ActionRowBuilder().addComponents(
        team1Button,
        team2Button
      );

      await interaction.reply({ embeds: [embed], components: [actionRow] });

      // 버튼 클릭 수집
      const filter = (btnInteraction) =>
        btnInteraction.customId === `join_team1_${matchId}` ||
        btnInteraction.customId === `join_team2_${matchId}`;

      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 600000, // 10분
      });

      collector.on("collect", async (btnInteraction) => {
        const userId = btnInteraction.user.id;
        const guildMember = await interaction.guild.members.fetch(userId);
        const displayName = guildMember.displayName;
        const currentMatch = ongoingMatches[matchId];

        if (btnInteraction.customId === `join_team1_${matchId}`) {
          if (currentMatch.team1.includes(userId)) {
            await btnInteraction.reply({
              content: "이미 팀 1에 참가한 상태입니다.",
              ephemeral: true,
            });
          } else if (currentMatch.team2.includes(userId)) {
            await btnInteraction.reply({
              content: "이미 팀 2에 참가한 상태입니다.",
              ephemeral: true,
            });
          } else {
            currentMatch.team1.push(userId);
            saveOngoingMatches(ongoingMatches);
            await btnInteraction.reply({
              content: `${displayName}님이 팀 1에 참가했습니다!`,
              ephemeral: true,
            });
          }
        } else if (btnInteraction.customId === `join_team2_${matchId}`) {
          if (currentMatch.team2.includes(userId)) {
            await btnInteraction.reply({
              content: "이미 팀 2에 참가한 상태입니다.",
              ephemeral: true,
            });
          } else if (currentMatch.team1.includes(userId)) {
            await btnInteraction.reply({
              content: "이미 팀 1에 참가한 상태입니다.",
              ephemeral: true,
            });
          } else {
            currentMatch.team2.push(userId);
            saveOngoingMatches(ongoingMatches);
            await btnInteraction.reply({
              content: `${displayName}님이 팀 2에 참가했습니다!`,
              ephemeral: true,
            });
          }
        }
      });

      collector.on("end", async () => {
        const currentMatch = ongoingMatches[matchId];

        const team1Names = await Promise.all(
          currentMatch.team1.map(async (userId) => {
            const member = await interaction.guild.members.fetch(userId);
            return member.displayName;
          })
        );

        const team2Names = await Promise.all(
          currentMatch.team2.map(async (userId) => {
            const member = await interaction.guild.members.fetch(userId);
            return member.displayName;
          })
        );

        const summary =
          `내전 ${matchName} (${matchId}) 참가 종료!\n` +
          `**팀 1 (${await interaction.guild.members
            .fetch(currentMatch.team1LeaderId)
            .then((m) => m.displayName)}):** ${team1Names.join(", ") || "없음"}\n` +
          `**팀 2 (${await interaction.guild.members
            .fetch(currentMatch.team2LeaderId)
            .then((m) => m.displayName)}):** ${team2Names.join(", ") || "없음"}`;
        await interaction.followUp(summary);
        delete ongoingMatches[matchId]; // 내전 데이터 삭제
        saveOngoingMatches(ongoingMatches);
      });
    } catch (error) {
      console.error("Error during match creation:", error);
      await interaction.reply("내전 생성 중 오류가 발생했습니다.");
    }
  },
};
