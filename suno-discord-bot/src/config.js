require('dotenv').config();

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

function int(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  botName: process.env.BOT_NAME || 'Nexus Suno Bot',
  accent: Number.parseInt(process.env.BOT_ACCENT || 'FF6A00', 16),
  footer: process.env.BOT_FOOTER || 'Only Suno music allowed • Nexus Suno Bot',
  lockToGuild: bool(process.env.LOCK_TO_GUILD, true),
  allowUploads: bool(process.env.ALLOW_UPLOADS, false),
  allowDirectMp3: bool(process.env.ALLOW_DIRECT_MP3, true),
  maxQueueSize: int(process.env.MAX_QUEUE_SIZE, 50),
  maxTrackSeconds: int(process.env.MAX_TRACK_SECONDS, 600),
  djRoleNames: (process.env.DJ_ROLE_NAMES || 'DJ,Radio DJ,Staff,Admin')
    .split(',')
    .map(r => r.trim().toLowerCase())
    .filter(Boolean),
  leaveWhenEmpty: bool(process.env.LEAVE_WHEN_EMPTY, true),
  emptyLeaveSeconds: int(process.env.EMPTY_LEAVE_SECONDS, 60),
  webDashboard: bool(process.env.WEB_DASHBOARD, false),
  port: int(process.env.PORT, 3000)
};
