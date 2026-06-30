# Nexus Suno Discord Bot

A Discord music bot designed to play **Suno-only music** inside your Discord server.

## What this version includes

- Suno-only URL guard
- Optional uploads, disabled by default
- Discord voice playback
- Queue system
- Now Playing embeds
- Skip / stop / leave controls
- DJ role protection
- Save / load / delete playlists
- 24/7 radio mode toggle
- Locked to your Discord server through `GUILD_ID`
- Windows Server 2022 / VPS friendly setup

## Important Suno-only note

The bot can strictly block non-Suno URLs. It cannot prove that a manually uploaded MP3 was created by Suno. For the strictest setup, keep this in `.env`:

```env
ALLOW_UPLOADS=false
ALLOW_DIRECT_MP3=false
```

That makes the bot accept Suno URLs only.

## Install on Windows VPS

Open CMD in the bot folder, then run:

```bat
npm install
```

Check Node/FFmpeg:

```bat
npm run check
```

Copy `.env.example` to `.env`:

```bat
rename .env.example .env
notepad .env
```

Fill in:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_client_id
GUILD_ID=your_discord_server_id
```

Deploy commands:

```bat
npm run deploy
```

Start the bot:

```bat
npm start
```

## Invite permissions

Discord Developer Portal → OAuth2 → URL Generator.

Scopes:

- bot
- applications.commands

Bot permissions:

- Send Messages
- Connect
- Speak
- Use Slash Commands
- Embed Links
- Read Message History

## Commands

- `/play url:<suno link>`
- `/queue`
- `/nowplaying`
- `/skip`
- `/stop`
- `/leave`
- `/radio mode:on/off`
- `/saveplaylist name:<name>`
- `/loadplaylist name:<name>`
- `/playlists`
- `/deleteplaylist name:<name>`
- `/botstatus`

## Recommended strict setup

For a bot that only plays inside your server and only accepts Suno links:

```env
LOCK_TO_GUILD=true
ALLOW_UPLOADS=false
ALLOW_DIRECT_MP3=false
```

## Running 24/7 with PM2

```bat
npm install -g pm2
pm2 start src/index.js --name nexus-suno-bot
pm2 save
```

To restart:

```bat
pm2 restart nexus-suno-bot
```

To view logs:

```bat
pm2 logs nexus-suno-bot
```
