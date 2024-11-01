const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Collection,
} = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: client.commands.map((cmd) => cmd.data) }
    );
    console.log("슬래시 명령어가 성공적으로 등록되었습니다.");
  } catch (error) {
    console.error(error);
  }
})();

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "명령어 실행 중 오류가 발생했습니다.",
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
