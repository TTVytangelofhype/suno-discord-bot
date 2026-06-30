const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a Suno track only')
    .addStringOption(o =>
      o.setName('url')
        .setDescription('Suno song URL')
        .setRequired(false)
    )
    .addAttachmentOption(o =>
      o.setName('file')
        .setDescription('Optional audio upload if enabled')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('addqueue')
    .setDescription('Add a Suno song to the queue')
    .addStringOption(o =>
      o.setName('url')
        .setDescription('Suno song URL')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the Suno queue'),

  new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the current Suno track'),

  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track'),

  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback and clear the queue'),

  new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Disconnect the bot from voice'),

  new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Turn 24/7 radio mode on or off')
    .addStringOption(o =>
      o.setName('mode')
        .setDescription('on/off')
        .setRequired(true)
        .addChoices(
          { name: 'on', value: 'on' },
          { name: 'off', value: 'off' }
        )
    ),

  new SlashCommandBuilder()
    .setName('saveplaylist')
    .setDescription('Save the current queue as a playlist')
    .addStringOption(o =>
      o.setName('name')
        .setDescription('Playlist name')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('loadplaylist')
    .setDescription('Load a saved playlist')
    .addStringOption(o =>
      o.setName('name')
        .setDescription('Playlist name')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('playlists')
    .setDescription('List saved playlists'),

  new SlashCommandBuilder()
    .setName('deleteplaylist')
    .setDescription('Delete a saved playlist')
    .addStringOption(o =>
      o.setName('name')
        .setDescription('Playlist name')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('botstatus')
    .setDescription('Show bot status and lock settings')
].map(c => c.toJSON());

async function main() {
  if (!config.token || !config.clientId || !config.guildId) {
    console.error('Missing DISCORD_TOKEN, CLIENT_ID or GUILD_ID in .env');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  console.log('Deploying slash commands to your Discord server...');
  await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: commands }
  );

  console.log('Done. Commands deployed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});