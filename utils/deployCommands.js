const { REST, Routes } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const commands = [];
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  if (!command.name || !command.description) {
    console.error(`Command "${file}" is missing "name" or "description".`);
    continue; // name이나 description이 없는 명령어는 등록하지 않음
  }
  commands.push({
    name: command.name,
    description: command.description,
    options: command.options || [],
  });
  console.log(`Command loaded: ${command.name}`);
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
