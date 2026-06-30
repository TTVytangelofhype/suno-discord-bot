import { config } from './config.js';

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];

export function isAllowedSunoUrl(input) {
  try {
    const url = new URL(input);
    if (!['https:', 'http:'].includes(url.protocol)) return false;
    return config.allowedDomains.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function isAllowedAudioAttachment(attachment) {
  if (!config.allowAudioUploads || !attachment) return false;

  const filename = String(attachment.name || '').toLowerCase();
  const contentType = String(attachment.contentType || '').toLowerCase();

  const hasAudioExt = AUDIO_EXTENSIONS.some((ext) => filename.endsWith(ext));
  const hasAudioType = contentType.startsWith('audio/');

  return hasAudioExt || hasAudioType;
}

export function cleanTitle(input) {
  return String(input || 'Untitled Suno Track')
    .replace(/[`*_~|<>]/g, '')
    .slice(0, 80);
}
