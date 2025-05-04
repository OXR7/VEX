module.exports = {
    name: 'interactionCreate',
    execute: async (interaction, client) => {

        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        };
    },
};