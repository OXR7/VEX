const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
]});
client.commands = new Collection();

const functions = fs.readdirSync('./Functions').filter(file => file.endsWith('.js'));
const eventsFiles = fs.readdirSync('./Events').filter(file => file.endsWith('.js'));
const commandFolders = fs.readdirSync('./Commands');

for (file of functions) {
    require(`./Functions/${file}`)(client);
}

client.handleEvents(eventsFiles, './Events');
client.handleCommands(commandFolders, './Commands');

client.login(process.env.token);