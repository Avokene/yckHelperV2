const { PermissionsBitField } = require("discord.js");

// 관리자로 인식될 Discord ID 배열
// 관리자 id
const ADMIN_IDS = [
  "141715991175495680", // 께니
  "398444366781480960", // 람쥐
];

/**
 * 관리 권한 확인 함수
 * @param {Object} interaction - Discord 상호작용 객체
 * @returns {boolean} - 관리 권한 여부
 */
function hasAdminPermission(interaction) {
  const userId = interaction.user.id;

  // Discord 관리자 권한 확인
  const isDiscordAdmin = interaction.member.permissions.has(
    PermissionsBitField.Flags.Administrator
  );

  // 코드에 지정된 관리자 ID 확인
  const isCodeAdmin = ADMIN_IDS.includes(userId);

  return isDiscordAdmin || isCodeAdmin;
}

module.exports = hasAdminPermission;
