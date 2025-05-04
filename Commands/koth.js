const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('koth')
        .setDescription('See the current king of the hill on pump.fun!'),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const response = await axios.get('https://frontend-api-v3.pump.fun/coins/king-of-the-hill');
            const koth = response.data;

            const response2 = await axios.get(`https://data.solanatracker.io/tokens/${koth.mint}`, {
                headers: {
                    'x-api-key': `${process.env.apiKey}`
                }
            });
            const data = response2.data;

            const embed = new EmbedBuilder()
                .setColor(0xffd900)
                .setTitle('👑 King of the Hill')
                .setDescription(`**🕰️ Created At:** <t:${data.pools.find(pool => pool.market === 'pumpfun')?.createdAt ? Math.round(data.pools.find(pool => pool.market === 'pumpfun')?.createdAt / 1000) : 'N/A'}:f>\n**💎 Market Cap:** $${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(data.pools[0].marketCap.usd)}\n**⚡ Volume:** ${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(data.pools.find(pool => pool.market === 'pumpfun')?.createdAt ? Math.round(data.pools.find(pool => pool.market === 'pumpfun')?.txns.volume) : 0)}\n**🗿 Holders:** ${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(data.holders)}\n**🌮 Bonding Curve:** ${data.pools.find(pool => pool.market === 'pumpfun')?.curvePercentage != null ? `${data.pools.find(pool => pool.market === 'pumpfun').curvePercentage.toFixed(2)}%` : 'N/A'}\n\n**🌐 Website:** ${data.token.website && /^https?:\/\//.test(data.token.website) ? `[${new URL(data.token.website).hostname.replace('www.', '')}](${data.token.website})` : 'N/A'}\n**🐦 X:** ${data.token.twitter?.match(/^https?:\/\/(?:x|twitter)\.com\/([^\/?#]+)/) ? `[@${data.token.twitter.match(/^https?:\/\/(?:x|twitter)\.com\/([^\/?#]+)/)[1]}](${data.token.twitter})` : data.token.twitter?.startsWith('http') ? `[Link](${data.token.twitter})` : 'N/A'}\n\n\`${koth.mint}\`\n\n**⚠️ __Risks__**\n${data.risk?.risks?.map(r => `> ${r.description}`).join('\n') || '> None'}\n> \n> Risk Score: ${data.risk.score}/10`)
                .setThumbnail(data.token.image)
                .setTimestamp();

            const button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Axiom')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://axiom.trade/t/${koth.mint}/@oxr`)
                    .setEmoji('1368151509585367072'),

                new ButtonBuilder()
                    .setLabel('Photon')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://photon-sol.tinyastro.io/en/lp/${koth.mint}`)
                    .setEmoji('1368151566875627610'),

                new ButtonBuilder()
                    .setLabel('GMGN')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://gmgn.ai/sol/token/${koth.mint}`)
                    .setEmoji('1368151537301590107'),
            );

            return interaction.editReply({ content: `**[${data.token.name}](https://pump.fun/coin/${koth.mint}) - $${data.token.symbol}**`, embeds: [embed], components: [button] });
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