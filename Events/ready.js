const { ActivityType } = require('discord.js');
const WebSocket = require('ws');

module.exports = {
    name: 'ready',
    once: true,
    execute: async (client) => {
        console.clear();
        console.log(`Ready! Logged in as ${client.user.tag} on Node ${process.version}`);
        client.user.setActivity('with solamis', { type: ActivityType.Playing });

        const ws = new WebSocket('wss://pumpportal.fun/api/data');
        const wallets = process.env.wallets;

        ws.on('open', function open() {
            let payload = {
                method: 'subscribeAccountTrade',
                keys: wallets.map(wallet => wallet.wallet),
            };

            ws.send(JSON.stringify(payload));
        });

        ws.on('message', function message(data) {
            const message = JSON.parse(data);

            if (!message.mint) return;

            if (message.txType === 'buy') {
                const channel = client.channels.cache.get('1368493451192045661');

                const wallet = wallets.find(wallet => wallet.wallet === message.traderPublicKey);
                return channel.send({ content: `${message.mint} - #${wallet.id} - ${wallet.winrate}` });
            }
        });
    },
};