const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pnl')
        .setDescription('Generate a PNL card!')
        .addStringOption(option =>
            option.setName('token')
                .setDescription('Enter the token address')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('wallet')
                .setDescription('Enter your wallet address')
                .setRequired(true)
        ),
    async execute(interaction, client) {
        await interaction.deferReply();

        const token = interaction.options.getString('token');
        const wallet = interaction.options.getString('wallet');

        try {
            const tokenInfo = await axios.get(`https://data.solanatracker.io/tokens/${token}`, {
                headers: {
                    'x-api-key': `${process.env.apiKey}`
                }
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            const pnl = await axios.get(`https://data.solanatracker.io/pnl/${wallet}/${token}`, {
                headers: {
                    'x-api-key': `${process.env.apiKey}`
                }
            });

            const rawProfitUsd = pnl.data.total_sold - pnl.data.total_invested;
            const rawProfitPercent = (rawProfitUsd / pnl.data.total_invested) * 100;

            const profitUsdSign = rawProfitUsd >= 0 ? '+' : '-';
            const profitPercentSign = rawProfitPercent >= 0 ? '+' : '';

            const ticker = `$${tokenInfo.data.token.symbol.toUpperCase()}`;
            const profit = `${profitUsdSign}$${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.abs(rawProfitUsd).toFixed(0))}`;
            const bought = `$${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(pnl.data.total_invested.toFixed(0))}`;
            const sold = `$${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(pnl.data.total_sold.toFixed(0))}`;
            const profitPercent = `${profitPercentSign}${rawProfitPercent.toFixed(0)}%`;

            function centerText(ctx, text, x, y) {
                const metrics = ctx.measureText(text);
                const textWidth = metrics.width;
                ctx.fillText(text, x - textWidth / 2, y);
            }

            function rightAlignText(ctx, text, x, y) {
                const metrics = ctx.measureText(text);
                const textWidth = metrics.width;
                ctx.fillText(text, x - textWidth, y);
            }

            const background = await loadImage(path.join(__dirname, './../template.png'));
            const canvas = createCanvas(background.width, background.height);
            const ctx = canvas.getContext('2d');

            registerFont(path.join(__dirname, './../Fonts', 'SpecialGothic.ttf'), { family: 'Special Gothic' });

            ctx.drawImage(background, 0, 0);
            ctx.textBaseline = 'top';

            // TICKER
            ctx.font = 'bold 60px Special Gothic';
            ctx.fillStyle = '#FFFFFF';
            centerText(ctx, ticker, 201, 120);

            // PROFIT
            ctx.font = 'bold 60px Special Gothic';
            const gradient = ctx.createLinearGradient(201, 197, 201, 197 + 60);
            gradient.addColorStop(0, '#999999');  // top
            gradient.addColorStop(1, '#03205a');  // bottom
            ctx.fillStyle = gradient;
            centerText(ctx, profit, 201, 197);

            // BOUGHT
            ctx.font = 'bold 20px Special Gothic';
            ctx.fillStyle = '#FFFFFF';
            rightAlignText(ctx, bought, 364, 308);

            // SOLD
            ctx.font = 'bold 20px Special Gothic';
            ctx.fillStyle = '#FFFFFF';
            rightAlignText(ctx, sold, 364, 353);

            // PNL
            ctx.font = 'bold 20px Special Gothic';
            ctx.fillStyle = '#FFFFFF';
            rightAlignText(ctx, profitPercent, 364, 398);

            // USERNAME
            ctx.font = 'bold 15px Special Gothic';
            ctx.fillStyle = '#FFFFFF';
            rightAlignText(ctx, `@${interaction.user.username.toUpperCase()}`, 364.5, 498);

            const buffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'pnl.png' });

            return interaction.editReply({ files: [attachment] });
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