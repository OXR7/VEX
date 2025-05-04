const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('metas')
        .setDescription('See the current metas on pump.fun!'),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const response = await axios.get('https://frontend-api-v3.pump.fun/metas/current');
            const metas = response.data;

            const description = metas
                .map((meta, index) => `**#${index + 1}** ${meta.word_with_strength}`)
                .join('\n');

            const embed = new EmbedBuilder()
                .setColor(0x005086)
                .setTitle('🔥 Current Metas')
                .setDescription(description)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(0x005086)
                .setTitle('Uh oh...')
                .setDescription(`We ran into a problem, please try again later!\n\n\`${error.message}\``)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }
    },
};