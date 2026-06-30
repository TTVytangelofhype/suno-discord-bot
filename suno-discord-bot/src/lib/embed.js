const { EmbedBuilder } = require('discord.js');
const config = require('../config');

function embed(title, description) {
  return new EmbedBuilder()
    .setColor(config.accent)
    .setTitle(title)
    .setDescription(description || null)
    .setTimestamp()
    .setFooter({ text: config.footer });
}

function errorEmbed(message) {
  return embed('⛔ Suno Bot Notice', message);
}

module.exports = { embed, errorEmbed };
