const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Shows the stats for all the callouts!'),
    async execute(interaction, client) {
        await interaction.deferReply();

        if (interaction.user.id !== '1332015302946324524') {
            return interaction.editReply({ content: 'You are not allowed to use this command!', flags: MessageFlags.Ephemeral });
        }

        const channelIDs = ['1368493451192045661', '1368972013179502652'];
        const profitPercents = [];

        for (const channelID of channelIDs) {
            const channel = await client.channels.fetch(channelID);
            if (!channel || !channel.isTextBased()) continue;

            let lastMessageId = null;
            let fetching = true;

            while (fetching) {
                const fetchOptions = { limit: 100 };
                if (lastMessageId) fetchOptions.before = lastMessageId;

                const messages = await channel.messages.fetch(fetchOptions);
                if (messages.size === 0) break;

                for (const message of messages.values()) {
                    lastMessageId = message.id;

                    if (message.author.id !== client.user.id) continue;
                    if (!message.components || message.components.length === 0) continue;

                    for (const row of message.components) {
                        for (const component of row.components) {
                            if (component.type === 2 && component.style === 1) {
                                const customId = component.customId;

                                const parts = customId.split('_');
                                if (parts.length === 4 && parts[0] === 'pnl') {
                                    const CA = parts[1];
                                    const MC = parts[2];
                                    const TIMESTAMP = parts[3];

                                    await new Promise(resolve => setTimeout(resolve, 1000));

                                    try {
                                        const response = await axios.get(`https://data.solanatracker.io/price/history/range?token=${CA}&time_from=${Math.floor(TIMESTAMP / 1000) - 30}&time_to=${Math.floor(Date.now() / 1000)}`, {
                                            headers: {
                                                'x-api-key': `${process.env.apiKey}`
                                            }
                                        });

                                        const highest = parseFloat(response.data?.price?.highest?.marketcap);
                                        const initial = parseFloat(MC);

                                        if (!isNaN(highest) && !isNaN(initial) && initial > 0) {
                                            const change = ((highest - initial) / initial) * 100;
                                            const rounded = Math.round(change);
                                            const formatted = `${rounded >= 0 ? '+' : ''}${rounded}%`;
                                            profitPercents.push({ raw: rounded, formatted });
                                        }
                                    } catch (error) {
                                        const embed = new EmbedBuilder()
                                            .setColor(0x005086)
                                            .setTitle('Uh oh...')
                                            .setDescription(`We ran into a problem, please try again later!\n\n\`${error}\``)
                                            .setTimestamp();

                                        return interaction.reply({ embeds: [embed] });
                                    }
                                }
                            }
                        }
                    }
                }

                if (messages.size < 100) fetching = false;
            }
        }

        let total = 0;
        let over500 = 0;
        let from100to500 = 0;
        let from50to100 = 0;
        let from1to50 = 0;

        for (const entry of profitPercents) {
            total += entry.raw;
            const abs = Math.abs(entry.raw);

            if (abs >= 500) over500++;
            else if (abs >= 100) from100to500++;
            else if (abs >= 50) from50to100++;
            else if (abs >= 1) from1to50++;
        }

        const embed = new EmbedBuilder()
            .setColor(0x005086)
            .setTitle('📊 Stats')
            .setDescription(`**Total:** ${total}%\n\n**500%+** (${over500} total)\n**100-500%** (${from100to500} total)\n**50-100%** (${from50to100} total)\n**1-50%** (${from1to50} total)`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};