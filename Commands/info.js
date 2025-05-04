const { EmbedBuilder, SlashCommandBuilder, version } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Shows the bots info!'),
    async execute(interaction, client) {
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setColor(0x005086)
            .setAuthor({ name: `${client.user.username}`, iconURL: `${client.user.avatarURL({ dynamic: true })}` })
            .setDescription(`Name: ${client.user.username}\nID: ${client.user.id}\nUptime: ${ms(client.uptime)}`)
            .setThumbnail(client.user.avatarURL({ dynamic: true }))
            .addFields(
                { name: 'Client Since', value: `<t:${Math.round(client.user.createdTimestamp / 1000)}:d>`, inline: true },
                { name: 'Discord.js Version', value: `${version}`, inline: true },
                { name: 'Node.js Version', value: `${process.version}`, inline: true }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    },
};