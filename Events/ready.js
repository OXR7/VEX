const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute: async (client) => {
        console.clear();
        console.log(`Ready! Logged in as ${client.user.tag} on Node ${process.version}`);
        client.user.setActivity('with solamis', { type: ActivityType.Playing });
    },
};