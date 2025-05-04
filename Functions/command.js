const { REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');

module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {

        client.commandArray = [];
        const commandFiles = fs.readdirSync('./Commands').filter((file) => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(`../Commands/${file}`);
            client.commands.set(command.data.name, command);
            client.commandArray.push(command.data.toJSON());
        }

        const rest = new REST({ version: '9' }).setToken(process.env.token);

        rest.put(Routes.applicationGuildCommands(process.env.clientID, process.env.guildID),
            { body: client.commandArray })
            .then(() => console.log('Successfully registered guild application (/) commands!'))
            .catch(console.error);
    };
};