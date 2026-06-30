import {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior
} from '@discordjs/voice';

export class GuildPlayer {
  constructor(guildId) {
    this.guildId = guildId;
    this.queue = [];
    this.current = null;
    this.connection = null;

    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.current = null;
      this.playNext().catch(console.error);
    });

    this.player.on('error', (error) => {
      console.error(`[${this.guildId}] Audio error:`, error);
      this.current = null;
      this.playNext().catch(console.error);
    });
  }

  async connect(voiceChannel) {
    if (this.connection) return this.connection;

    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false
    });

    this.connection.subscribe(this.player);

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000)
        ]);
      } catch {
        this.destroy();
      }
    });

    await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
    return this.connection;
  }

  add(track) {
    this.queue.push(track);

    if (this.player.state.status !== AudioPlayerStatus.Playing) {
      this.playNext().catch(console.error);
    }
  }

  async playNext() {
    if (!this.connection) return;

    const next = this.queue.shift();
    if (!next) return;

    this.current = next;

    const playUrl = next.streamUrl || next.url;

    if (!playUrl) {
      console.error('No playable URL found for track:', next);
      this.current = null;
      return this.playNext().catch(console.error);
    }

    console.log('Playing URL:', playUrl);

    const resource = createAudioResource(playUrl, {
      metadata: next
    });

    this.player.play(resource);
  }

  skip() {
    this.player.stop(true);
  }

  stop() {
    this.queue = [];
    this.current = null;
    this.player.stop(true);
    this.destroy();
  }

  destroy() {
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
  }
}

const players = new Map();

export function getGuildPlayer(guildId) {
  if (!players.has(guildId)) {
    players.set(guildId, new GuildPlayer(guildId));
  }

  return players.get(guildId);
}