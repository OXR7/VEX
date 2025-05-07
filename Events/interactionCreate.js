const { AttachmentBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');

module.exports = {
    name: 'interactionCreate',
    execute: async (interaction, client) => {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                return interaction.reply({ content: 'Command not found!', flags: MessageFlags.Ephemeral });
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            }
        }

        try {
            if (interaction.isButton() && interaction.customId.startsWith('pnl_')) {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const [_, id1, id2, id3] = interaction.customId.split('_');

                const token = await axios.get(`https://data.solanatracker.io/tokens/${id1}`, {
                    headers: {
                        'x-api-key': `${process.env.apiKey}`
                    }
                });

                await new Promise(resolve => setTimeout(resolve, 1000));

                const ath = await axios.get(`https://data.solanatracker.io/price/history/range?token=${id1}&time_from=${parseInt(Math.floor(id3 / 1000) - 30)}&time_to=${Math.floor(Date.now() / 1000)}`, {
                    headers: {
                        'x-api-key': `${process.env.apiKey}`
                    }
                });

                await new Promise(resolve => setTimeout(resolve, 1000));

                let chart;
                if (Math.floor(parseInt(id3)) < Math.floor(Date.now() / 1000) - 7200) {
                    chart = await axios.get(`https://data.solanatracker.io/chart/${id1}?type=5s&time_from=${parseInt(Math.floor(id3 / 1000) - 30)}`, {
                        headers: {
                            'x-api-key': `${process.env.apiKey}`
                        }
                    });
                } else {
                    chart = await axios.get(`https://data.solanatracker.io/chart/${id1}?type=1m&time_from=${parseInt(Math.floor(id3 / 1000) - 30)}`, {
                        headers: {
                            'x-api-key': `${process.env.apiKey}`
                        }
                    });
                }

                const ticker = `$${token.data.token.symbol.toUpperCase()}`;
                const calledAt = `$${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(parseInt(id2))}`;
                const reached = `$${Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(ath.data.price.highest.marketcap)}`;
                const profitPercent = `${((ath.data.price.highest.marketcap - parseInt(id2)) / parseInt(id2) * 100).toFixed(0) >= 0 ? '+' : ''}${((ath.data.price.highest.marketcap - parseInt(id2)) / parseInt(id2) * 100).toFixed(0)}%`;

                function rightAlignText(ctx, text, x, y) {
                    const metrics = ctx.measureText(text);
                    const textWidth = metrics.width;
                    ctx.fillText(text, x - textWidth, y);
                }

                const background = await loadImage(path.join(__dirname, './../template2.png'));
                const canvas = createCanvas(background.width, background.height);
                const ctx = canvas.getContext('2d');

                registerFont(path.join(__dirname, './../Fonts', 'SpecialGothic.ttf'), { family: 'Special Gothic' });

                ctx.drawImage(background, 0, 0);
                ctx.textBaseline = 'top';

                // TICKER
                ctx.font = 'bold 50px Special Gothic';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(ticker, 34, 103);

                // PROFIT
                ctx.font = 'bold 50px Special Gothic';
                const gradient = ctx.createLinearGradient(34, 166, 34, 166 + 50);
                gradient.addColorStop(0, '#999999');
                gradient.addColorStop(1, '#0a518e');
                ctx.fillStyle = gradient;
                ctx.fillText(profitPercent, 34, 166);

                // CALLED AT
                ctx.font = 'bold 17.5px Special Gothic';
                ctx.fillStyle = '#FFFFFF';
                rightAlignText(ctx, calledAt, 304, 242.5);

                // REACHED
                ctx.font = 'bold 17.5px Special Gothic';
                ctx.fillStyle = '#FFFFFF';
                rightAlignText(ctx, reached, 304, 283.5);

                // CHART
                drawChart(ctx, chart.data.oclhv, {
                    x: 330,
                    y: 110,
                    width: 300,
                    height: 200,
                    lineColor: '#FFFFFF',
                    lineWidth: 2,
                    callTimestamp: Number.parseInt(Math.floor(id3 / 1000))
                });

                const buffer = canvas.toBuffer('image/png');
                const attachment = new AttachmentBuilder(buffer, { name: 'pnl.png' });

                return interaction.editReply({ files: [attachment] });
            }
        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(0x005086)
                .setTitle('Uh oh...')
                .setDescription(`We ran into a problem, please try again later!\n\n\`${error}\``)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    },
};

function drawChart(ctx, data, options) {
    const processedData = processChartData(data, 10000);

    if (processedData.length === 0) {
        return console.log('No chart data available');
    }

    const chartX = options.x;
    const chartY = options.y;
    const chartWidth = options.width;
    const chartHeight = options.height;
    const callTimestamp = options.callTimestamp;

    const prices = processedData.map((d) => d.close);
    let minPrice = Math.min(...prices);
    let maxPrice = Math.max(...prices);

    const priceRange = maxPrice - minPrice;
    minPrice -= priceRange * 0.03;
    maxPrice += priceRange * 0.03;

    const xScale = chartWidth / (processedData.length - 1);
    const yScale = chartHeight / (maxPrice - minPrice);

    ctx.strokeStyle = options.lineColor;
    ctx.lineWidth = options.lineWidth;
    ctx.beginPath();

    let callPointX = null;
    let callPointY = null;
    let callPointIndex = -1;

    if (callTimestamp) {
        let closestTimeDiff = Number.POSITIVE_INFINITY;
        processedData.forEach((point, index) => {
            const timeDiff = Math.abs(point.time - callTimestamp);
            if (timeDiff < closestTimeDiff) {
                closestTimeDiff = timeDiff;
                callPointIndex = index;
            }
        });
    }

    for (let i = 0; i < processedData.length; i++) {
        const x = chartX + i * xScale;
        const y = chartY + chartHeight - (processedData[i].close - minPrice) * yScale;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        if (i === callPointIndex) {
            callPointX = x;
            callPointY = y;
        }
    }

    ctx.stroke();

    if (callPointX !== null && callPointY !== null) {
        ctx.fillStyle = '#0066cc';

        const tagWidth = 10;
        const tagHeight = 10;
        const cornerRadius = 2;
        const stemWidth = 5;

        ctx.save();

        const x = callPointX - tagWidth / 2;
        const y = callPointY - tagHeight - 6;

        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + tagWidth - cornerRadius, y);
        ctx.quadraticCurveTo(x + tagWidth, y, x + tagWidth, y + cornerRadius);
        ctx.lineTo(x + tagWidth, y + tagHeight - cornerRadius);
        ctx.quadraticCurveTo(x + tagWidth, y + tagHeight, x + tagWidth - cornerRadius, y + tagHeight);

        ctx.lineTo(x + tagWidth / 2 + stemWidth / 2, y + tagHeight);
        ctx.lineTo(callPointX, callPointY - 2);
        ctx.lineTo(x + tagWidth / 2 - stemWidth / 2, y + tagHeight);

        ctx.lineTo(x + cornerRadius, y + tagHeight);
        ctx.quadraticCurveTo(x, y + tagHeight, x, y + tagHeight - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);

        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 7px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = x + tagWidth / 2;
        const centerY = y + tagHeight / 2;

        const offsetX = 0.7

        ctx.fillText('C', centerX + offsetX, centerY);
        ctx.fillText('C', centerX + offsetX + 0.5, centerY);

        ctx.restore();
    }
};

function processChartData(data, maxPoints) {
    if (!data || data.length === 0) {
        return [];
    }

    const sortedData = [...data].sort((a, b) => a.time - b.time);

    if (sortedData.length > maxPoints) {
        const step = Math.floor(sortedData.length / maxPoints);
        return sortedData.filter((_, index) => index % step === 0).slice(0, maxPoints);
    }

    return sortedData;
};