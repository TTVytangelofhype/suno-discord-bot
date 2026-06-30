const config = require('../config');

const SUNO_HOSTS = new Set([
  'suno.com',
  'www.suno.com',
  'app.suno.ai',
  'suno.ai',
  'cdn1.suno.ai',
  'cdn2.suno.ai',
  'cdn.suno.ai'
]);

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];

function safeUrl(input) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function isSunoUrl(input) {
  const url = safeUrl(input);
  if (!url) return false;
  return SUNO_HOSTS.has(url.hostname.toLowerCase()) || url.hostname.toLowerCase().endsWith('.suno.ai');
}

function isDirectAudioUrl(input) {
  const url = safeUrl(input);
  if (!url) return false;
  const path = url.pathname.toLowerCase();
  return AUDIO_EXTENSIONS.some(ext => path.endsWith(ext));
}

function isAllowedAttachment(attachment) {
  if (!config.allowUploads) return { ok: false, reason: 'Uploads are disabled. Use a Suno link instead.' };
  const name = (attachment.name || '').toLowerCase();
  const contentType = (attachment.contentType || '').toLowerCase();
  const looksAudio = contentType.startsWith('audio/') || AUDIO_EXTENSIONS.some(ext => name.endsWith(ext));
  if (!looksAudio) return { ok: false, reason: 'Only audio uploads are allowed.' };
  return { ok: true };
}

function validatePlayInput({ url, attachment }) {
  if (attachment) return isAllowedAttachment(attachment);
  if (!url) return { ok: false, reason: 'Add a Suno link or attach an audio file if uploads are enabled.' };

  if (isSunoUrl(url)) return { ok: true };

  if (config.allowDirectMp3 && isDirectAudioUrl(url)) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: 'Blocked. This bot only accepts Suno links. YouTube, Spotify, SoundCloud and normal MP3 links are not allowed.'
  };
}

module.exports = { isSunoUrl, isDirectAudioUrl, validatePlayInput };
