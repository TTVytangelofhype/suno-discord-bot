const { getLavalink } = require('./lavalink');

class GuildPlayer {
  constructor(guildId) {
    this.guildId = guildId;
    this.queue = [];
    this.current = null;
    this.textChannel = null;
    this.voiceChannel = null;
    this.lavalinkPlayer = null;
    this.endHooked = false;
  }

  async connect(voiceChannel, textChannel) {
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;

    const manager = getLavalink();

    let player = manager.players.get(this.guildId);

    if (!player) {
      player = await manager.createPlayer({
        guildId: this.guildId,
        textId: textChannel.id,
        voiceId: voiceChannel.id,
        shardId: voiceChannel.guild.shardId || 0,
        deaf: false
      });
    }

    this.lavalinkPlayer = player;

    if (!this.endHooked) {
      manager.on('playerEnd', p => {
        if (p.guildId !== this.guildId) return;

        console.log('Track ended.');
        this.current = null;

        setTimeout(() => {
          this.playNext().catch(console.error);
        }, 1000);
      });

      manager.on('playerEmpty', p => {
        if (p.guildId !== this.guildId) return;

        console.log('Queue empty.');
        this.current = null;
      });

      this.endHooked = true;
    }

    return player;
  }

  add(track) {
    this.queue.push(track);
    console.log(`Track queued. Queue size: ${this.queue.length}`);

    if (!this.current && this.lavalinkPlayer && !this.lavalinkPlayer.playing) {
      this.playNext().catch(console.error);
    }
  }

  addMany(tracks) {
    for (const track of tracks) {
      this.queue.push(track);
    }

    console.log(`Tracks queued. Queue size: ${this.queue.length}`);

    if (!this.current && this.lavalinkPlayer && !this.lavalinkPlayer.playing) {
      this.playNext().catch(console.error);
    }
  }

  async playNext() {
    if (!this.lavalinkPlayer) return;
    if (this.current) return;

    const manager = getLavalink();

    if (!manager || !manager.shoukaku || manager.shoukaku.nodes.size === 0) {
  console.error('No Lavalink node connected. Retrying in 5 seconds...');

  this.current = null;

  setTimeout(() => {
    this.playNext().catch(console.error);
  }, 5000);

  return;
}

    const next = this.queue.shift();
    if (!next) return;

    this.current = next;

    const playUrl = next.streamUrl || next.url;

    if (!playUrl) {
      console.error('No playable URL found:', next);
      this.current = null;
      return this.playNext();
    }

    console.log('Lavalink Playing URL:', playUrl);

    const result = await manager.search(playUrl, {
      requester: {
        id: String(next.requestedBy || 'suno-bot')
      }
    });

    if (!result || !result.tracks || !result.tracks.length) {
      console.error('Lavalink could not load track:', playUrl);
      this.current = null;
      return this.playNext();
    }

    const lavalinkTrack = result.tracks[0];

    console.log('Loaded Lavalink track:', lavalinkTrack.title || lavalinkTrack.info?.title || 'Unknown');

    await this.lavalinkPlayer.play(lavalinkTrack);
  }

  skip() {
    if (this.lavalinkPlayer) {
      this.current = null;
      this.lavalinkPlayer.skip();
    }
  }

  stop() {
    this.queue = [];
    this.current = null;

    if (this.lavalinkPlayer) {
      this.lavalinkPlayer.destroy();
      this.lavalinkPlayer = null;
    }
  }

  destroy() {
    this.stop();
  }

  queueText() {
    const lines = [];

    if (this.current) {
      lines.push(`**Now Playing:** ${this.current.title || 'Unknown Suno Track'}`);
    }

    if (this.queue.length > 0) {
      lines.push('');
      lines.push('**Up Next:**');

      this.queue.forEach((track, index) => {
        lines.push(`${index + 1}. ${track.title || 'Unknown Suno Track'}`);
      });
    }

    if (lines.length === 0) {
      return 'No Suno tracks in the queue.';
    }

    return lines.join('\n');
  }
}

const players = new Map();

function getPlayer(guildId) {
  if (!players.has(guildId)) {
    players.set(guildId, new GuildPlayer(guildId));
  }

  return players.get(guildId);
}

module.exports = { getPlayer };