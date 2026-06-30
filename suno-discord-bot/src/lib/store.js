const fs = require('fs');
const path = require('path');

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

const playlistFile = path.join(__dirname, '../../data/playlists.json');

function getGuildPlaylists(guildId) {
  const all = readJson(playlistFile, {});
  return all[guildId] || {};
}

function savePlaylist(guildId, name, tracks) {
  const all = readJson(playlistFile, {});
  all[guildId] = all[guildId] || {};
  all[guildId][name.toLowerCase()] = { name, tracks, updatedAt: new Date().toISOString() };
  writeJson(playlistFile, all);
}

function deletePlaylist(guildId, name) {
  const all = readJson(playlistFile, {});
  if (all[guildId]) delete all[guildId][name.toLowerCase()];
  writeJson(playlistFile, all);
}

module.exports = { readJson, writeJson, getGuildPlaylists, savePlaylist, deletePlaylist };
