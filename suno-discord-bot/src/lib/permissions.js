const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

function isDj(member) {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  return member.roles.cache.some(role => config.djRoleNames.includes(role.name.toLowerCase()));
}

function requireDj(interaction) {
  if (isDj(interaction.member)) return true;
  return false;
}

module.exports = { isDj, requireDj };
