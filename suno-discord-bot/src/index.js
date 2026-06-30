const { initLavalink } = require('./lib/lavalink');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
const { Client, GatewayIntentBits, Events } = require('discord.js');
const config = require('./config');
const { embed, errorEmbed } = require('./lib/embed');
const { requireDj } = require('./lib/permissions');
const { validatePlayInput } = require('./lib/sunoGuard');
const { resolveTrack } = require('./lib/trackResolver');
const { getPlayer } = require('./lib/player');
const { getGuildPlaylists, savePlaylist, deletePlaylist } = require('./lib/store');
const { resolveSunoUrl } = require('./lib/sunoResolver');
if (!config.token) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

initLavalink(client);

function inLockedGuild(interaction) {
  return !config.lockToGuild || interaction.guildId === config.guildId;
}

async function safeReply(interaction, payload) {
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply(payload);
}

client.once(Events.ClientReady, c => {
  console.log(`Logged in as ${c.user.tag}`);
  console.log(`Locked to guild: ${config.lockToGuild ? config.guildId : 'false'}`);
  console.log(`Uploads allowed: ${config.allowUploads}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!inLockedGuild(interaction)) {
    return interaction.reply({ embeds: [errorEmbed('This bot is locked to its main Discord server only.')], ephemeral: true });
  }

  const cmd = interaction.commandName;
  const player = getPlayer(interaction.guildId);

  try {
    if (cmd === 'play') {
      await interaction.deferReply();
    
      const voiceChannel = interaction.member.voice?.channel;
      if (!voiceChannel) {
        return safeReply(interaction, { embeds: [errorEmbed('Join a voice channel first.')] });
      }
    
      const url = interaction.options.getString('url');
      const attachment = interaction.options.getAttachment('file');
    
      const check = validatePlayInput({ url, attachment });
      if (!check.ok) {
        return safeReply(interaction, { embeds: [errorEmbed(check.reason)] });
      }
    
      await player.connect(voiceChannel, interaction.channel);
console.log("Connected to voice channel:", voiceChannel.name);
    
      const originalUrl = url;
      const resolvedUrl = url ? await resolveSunoUrl(url) : null;
    
      const track = await resolveTrack({
        url: resolvedUrl,
        attachment,
        requestedBy: interaction.user.id
      });
    
      track.pageUrl = originalUrl || track.pageUrl;
      track.streamUrl = resolvedUrl || track.streamUrl;
      track.url = resolvedUrl || track.url || track.streamUrl;
    
      player.add(track);
    
      const e = embed(
        '✅ Added Suno Track',
        `[${track.title}](${track.pageUrl || track.streamUrl || track.url})\nAdded by <@${interaction.user.id}>`
      );
    
      if (track.artwork) e.setThumbnail(track.artwork);
    
      return safeReply(interaction, { embeds: [e] });
    }
    if (cmd === 'addqueue') {
  await interaction.deferReply();

  const voiceChannel = interaction.member.voice?.channel;

  if (!voiceChannel) {
    return safeReply(interaction, {
      embeds: [errorEmbed('Join a voice channel first.')]
    });
  }

  const url = interaction.options.getString('url');

  const check = validatePlayInput({
    url,
    attachment: null
  });

  if (!check.ok) {
    return safeReply(interaction, {
      embeds: [errorEmbed(check.reason)]
    });
  }

  await player.connect(voiceChannel, interaction.channel);

  const originalUrl = url;
  const resolvedUrl = await resolveSunoUrl(url);

  const track = await resolveTrack({
    url: resolvedUrl,
    attachment: null,
    requestedBy: interaction.user.id
  });

  track.pageUrl = originalUrl;
  track.streamUrl = resolvedUrl;
  track.url = resolvedUrl;

  player.add(track);

  return safeReply(interaction, {
    embeds: [
      embed(
        '🎶 Added To Queue',
        `[${track.title}](${track.pageUrl || track.streamUrl})\nAdded by <@${interaction.user.id}>`
      )
    ]
  });
}
    if (cmd === 'queue') {
      return interaction.reply({ embeds: [embed('🎶 Suno Queue', player.queueText())] });
    }

    if (cmd === 'nowplaying') {
      if (!player.current) return interaction.reply({ embeds: [embed('📻 Now Playing', 'Nothing is playing right now.')] });
      const e = embed('🔥 Now Playing', `[${player.current.title}](${player.current.pageUrl || player.current.streamUrl})\nRequested by <@${player.current.requestedBy}>`);
      if (player.current.artwork) e.setThumbnail(player.current.artwork);
      return interaction.reply({ embeds: [e] });
    }

    if (cmd === 'skip') {
      if (!requireDj(interaction)) return interaction.reply({ embeds: [errorEmbed('Only DJ/Staff roles can skip tracks.')], ephemeral: true });
      player.skip();
      return interaction.reply({ embeds: [embed('⏭️ Skipped', 'Skipped the current Suno track.')] });
    }

    if (cmd === 'stop') {
      if (!requireDj(interaction)) return interaction.reply({ embeds: [errorEmbed('Only DJ/Staff roles can stop the bot.')], ephemeral: true });
      player.stop();
      return interaction.reply({ embeds: [embed('⏹️ Stopped', 'Playback stopped and queue cleared.')] });
    }

    if (cmd === 'leave') {
      if (!requireDj(interaction)) return interaction.reply({ embeds: [errorEmbed('Only DJ/Staff roles can make the bot leave.')], ephemeral: true });
      player.destroy();
      return interaction.reply({ embeds: [embed('👋 Disconnected', 'Left the voice channel.')] });
    }

    if (cmd === 'radio') {
      if (!requireDj(interaction)) return interaction.reply({ embeds: [errorEmbed('Only DJ/Staff roles can control radio mode.')], ephemeral: true });
      const mode = interaction.options.getString('mode');
      player.radioMode = mode === 'on';
      return interaction.reply({ embeds: [embed('📻 Radio Mode', `24/7 radio mode is now **${mode.toUpperCase()}**.`)] });
    }

    if (cmd === 'saveplaylist') {
      if (!requireDj(interaction)) return interaction.reply({ embeds: [errorEmbed('Only DJ/Staff roles can save playlists.')], ephemeral: true });
      const name = interaction.options.getString('name');
      const tracks = [player.current, ...player.queue].filter(Boolean);
      if (!tracks.length) return interaction.reply({ embeds: [errorEmbed('There are no tracks to save.')] });
      savePlaylist(interaction.guildId, name, tracks);
      return interaction.reply({ embeds: [embed('💾 Playlist Saved', `Saved **${tracks.length}** Suno tracks as **${name}**.`)] });
    }

    if (cmd === 'loadplaylist') {
      if (!requireDj(interaction)) return interaction.reply({ embeds: [errorEmbed('Only DJ/Staff roles can load playlists.')], ephemeral: true });
      const voiceChannel = interaction.member.voice?.channel;
      if (!voiceChannel) return interaction.reply({ embeds: [errorEmbed('Join a voice channel first.')] });
      const name = interaction.options.getString('name');
      const playlists = getGuildPlaylists(interaction.guildId);
      const pl = playlists[name.toLowerCase()];
      if (!pl) return interaction.reply({ embeds: [errorEmbed(`Playlist **${name}** was not found.`)] });
      await player.connect(voiceChannel, interaction.channel);
      player.addMany(pl.tracks.map(t => ({ ...t, requestedBy: interaction.user.id })));
      return interaction.reply({ embeds: [embed('📀 Playlist Loaded', `Loaded **${pl.tracks.length}** Suno tracks from **${pl.name}**.`)] });
    }

    if (cmd === 'playlists') {
      const playlists = Object.values(getGuildPlaylists(interaction.guildId));
      const text = playlists.length ? playlists.map(p => `**${p.name}** — ${p.tracks.length} tracks`).join('\n') : 'No playlists saved yet.';
      return interaction.reply({ embeds: [embed('📚 Suno Playlists', text)] });
    }

    if (cmd === 'deleteplaylist') {
      if (!requireDj(interaction)) return interaction.reply({ embeds: [errorEmbed('Only DJ/Staff roles can delete playlists.')], ephemeral: true });
      const name = interaction.options.getString('name');
      deletePlaylist(interaction.guildId, name);
      return interaction.reply({ embeds: [embed('🗑️ Playlist Deleted', `Deleted playlist **${name}** if it existed.`)] });
    }

    if (cmd === 'botstatus') {
      return interaction.reply({ embeds: [embed('⚙️ Suno Bot Status', [
        `**Server locked:** ${config.lockToGuild ? 'Yes' : 'No'}`,
        `**Uploads allowed:** ${config.allowUploads ? 'Yes' : 'No'}`,
        `**Direct MP3 links:** ${config.allowDirectMp3 ? 'Yes' : 'No'}`,
        `**Max queue:** ${config.maxQueueSize}`,
        `**DJ roles:** ${config.djRoleNames.join(', ')}`,
        `**Radio mode:** ${player.radioMode ? 'On' : 'Off'}`
      ].join('\n'))] });
    }
  } catch (err) {
    console.error(err);
    return safeReply(interaction, { embeds: [errorEmbed(`Something went wrong: ${err.message}`)] }).catch(() => {});
  }
});

client.login(config.token);
