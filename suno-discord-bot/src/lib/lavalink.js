const { Kazagumo } = require('kazagumo');
const { Connectors } = require('shoukaku');
const { Client } = require('discord.js');

let kazagumo;

function initLavalink(client) {
  kazagumo = new Kazagumo(
    {
      defaultSearchEngine: 'youtube',
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      },
      reconnectTries: Infinity,
      reconnectInterval: 5000,
      resume: true,
      resumeTimeout: 60
    },
    new Connectors.DiscordJS(client),
    [
      {
        name: 'Main Lavalink',
        url: 'localhost:2333',
        auth: 'youshallnotpass',
        secure: false
      }
    ]
  );

  kazagumo.shoukaku.on('ready', name => {
    console.log(`Lavalink node connected: ${name}`);
  });

  kazagumo.shoukaku.on('disconnect', (name, reason) => {
    console.log(`Lavalink node disconnected: ${name}`, reason);
  });

  kazagumo.shoukaku.on('close', (name, code, reason) => {
    console.log(`Lavalink node closed: ${name}`, code, reason);
  });

  kazagumo.shoukaku.on('error', (name, error) => {
    console.error(`Lavalink node error on ${name}:`, error);
  });

  return kazagumo;
}

function getLavalink() {
  return kazagumo;
}

module.exports = {
  initLavalink,
  getLavalink
};