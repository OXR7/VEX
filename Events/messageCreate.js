const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PublicKey } = require('@solana/web3.js');
const axios = require('axios');

module.exports = {
    name: 'messageCreate',
    execute: async (message, client) => {
        const words = message.content.split(' ');

        // SCAN (TOKEN INFO)
        for (const word of words) {
            try {
                new PublicKey(word);

                const response = await axios.get(`https://data.solanatracker.io/tokens/${word}`, {
                    headers: {
                        'x-api-key': `${process.env.apiKey}`
                    }
                });
                const data = response.data;

                const embed = new EmbedBuilder()
                    .setColor(0x005086)
                    .setDescription(`**🕰️ Created At:** <t:${data.pools.find(pool => pool.market === 'pumpfun')?.createdAt ? Math.round(data.pools.find(pool => pool.market === 'pumpfun')?.createdAt / 1000) : '-62135596680'}:f>\n**💎 Market Cap:** $${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(data.pools[0].marketCap.usd)}\n**🗿 Holders:** ${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(data.holders)}\n**🌮 Bonding Curve:** ${data.pools.find(pool => pool.market === 'pumpfun')?.curvePercentage != null ? `${data.pools.find(pool => pool.market === 'pumpfun').curvePercentage.toFixed(2)}%` : 'N/A'}\n\n**🌐 Website:** ${data.token.website && /^https?:\/\//.test(data.token.website) ? `[${new URL(data.token.website).hostname.replace('www.', '')}](${data.token.website})` : 'N/A'}\n**🐦 X:** ${data.token.twitter?.match(/^https?:\/\/(?:x|twitter)\.com\/([^\/?#]+)/) ? `[@${data.token.twitter.match(/^https?:\/\/(?:x|twitter)\.com\/([^\/?#]+)/)[1]}](${data.token.twitter})` : data.token.twitter?.startsWith('http') ? `[Link](${data.token.twitter})` : 'N/A'}\n\n**⚠️ __Risks__**\n${data.risk?.risks?.map(r => `> ${r.description}`).join('\n') || '> None'}\n> \n> Risk Score: ${data.risk.score}/10`)
                    .setThumbnail(data.token.image)
                    .setTimestamp();

                const button = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Axiom')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://axiom.trade/t/${word}/@oxr`)
                        .setEmoji('1368151509585367072'),

                    new ButtonBuilder()
                        .setLabel('Photon')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://photon-sol.tinyastro.io/en/lp/${word}`)
                        .setEmoji('1368151566875627610'),

                    new ButtonBuilder()
                        .setLabel('GMGN')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://gmgn.ai/sol/token/${word}`)
                        .setEmoji('1368151537301590107'),
                );

                if (message.channel.id === '1368493451192045661' || message.channel.id === '1368972013179502652') {
                    button.addComponents(
                        new ButtonBuilder()
                            .setLabel('PNL')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`pnl_${word}_${Math.round(data.pools[0].marketCap.usd)}_${Date.now()}`)
                            .setEmoji('📊'),
                    );
                }

                return message.reply({ content: `**[${data.token.name}](https://pump.fun/coin/${word}) - $${data.token.symbol}**`, embeds: [embed], components: [button] })
            } catch (error) {
                console.log(error.message);
            }
        }
    },
};

