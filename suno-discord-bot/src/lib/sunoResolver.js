const config = require('../config');

async function resolveSunoUrl(url) {
  if (!url) return null;

  if (config.allowDirectMp3 && (url.endsWith('.mp3') || url.endsWith('.wav'))) {
    return url;
  }

  if (!url.includes('suno.com') && !url.includes('suno.ai')) {
    throw new Error('Only Suno links are allowed.');
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  const html = await res.text();

  const matches = html.match(/https:\/\/cdn[^"'\\]+\.suno\.ai\/[^"'\\]+\.mp3/g) || [];

  const realAudio = matches.find(link =>
    !link.includes('sil-100.mp3') &&
    !link.includes('silence') &&
    !link.includes('preview')
  );

  if (!realAudio) {
    throw new Error('Could not find the real Suno audio file. Suno returned only a silent placeholder. Use the direct downloaded Suno MP3 link instead.');
  }

  return realAudio;
}

module.exports = { resolveSunoUrl };