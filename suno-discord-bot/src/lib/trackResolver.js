const { request } = require('undici');
const { isSunoUrl } = require('./sunoGuard');

function cleanTitleFromUrl(input) {
  try {
    const url = new URL(input);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1]?.replace(/[-_]/g, ' ').slice(0, 80) || 'Suno Track';
  } catch {
    return 'Suno Track';
  }
}

async function fetchText(url) {
  const res = await request(url, {
    method: 'GET',
    headers: { 'user-agent': 'Mozilla/5.0 NexusSunoBot/2.0' },
    bodyTimeout: 15000,
    headersTimeout: 15000
  });
  if (res.statusCode >= 400) throw new Error(`Suno page returned HTTP ${res.statusCode}`);
  return await res.body.text();
}

function findMeta(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
  return html.match(re)?.[1]?.replace(/&amp;/g, '&') || null;
}

function findAudio(html) {
  const matches = html.match(/https?:\\?\/\\?\/[^"'\\]+?\.(?:mp3|wav|m4a)(?:\?[^"'\\]*)?/gi) || [];
  const fixed = matches.map(m => m.replace(/\\\//g, '/'));
  return fixed.find(u => u.includes('suno')) || fixed[0] || null;
}

async function resolveTrack({ url, attachment, requestedBy }) {
  if (attachment) {
    return {
      title: attachment.name || 'Uploaded Suno Audio',
      streamUrl: attachment.url,
      pageUrl: attachment.url,
      artwork: null,
      requestedBy
    };
  }

  if (!isSunoUrl(url)) throw new Error('Only Suno URLs are allowed.');

  let title = cleanTitleFromUrl(url);
  let streamUrl = url;
  let artwork = null;

  try {
    const html = await fetchText(url);
    title = findMeta(html, 'og:title') || findMeta(html, 'twitter:title') || title;
    artwork = findMeta(html, 'og:image') || findMeta(html, 'twitter:image') || null;
    streamUrl = findMeta(html, 'og:audio') || findMeta(html, 'og:audio:url') || findAudio(html) || url;
  } catch {
    // Keep original Suno URL. Some Suno pages block automated metadata reads.
  }

  return { title, streamUrl, pageUrl: url, artwork, requestedBy };
}

module.exports = { resolveTrack };
