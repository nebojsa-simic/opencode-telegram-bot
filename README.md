# opencode-telegram-bot

A production-ready Telegram bot plugin for opencode with streaming responses, persistent sessions, and smart timeout recovery.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start

1. Add to your `opencode.json` (in ~/.config/opencode/ or project root):

```json
{
  "plugin": ["github:nebojsa-simic/opencode-telegram-bot"]
}
```

2. Create `~/.config/opencode-bot/.env` with:

```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ALLOWLIST=724085721
CI=true
```

3. Restart opencode

**Get your bot token:** Message @BotFather on Telegram, send /newbot

**Get your chat ID:** Message your bot, then visit: https://api.telegram.org/bot<TOKEN>/getUpdates

That's it! Your bot is running 24/7.

## Manual Installation

If you prefer manual setup, copy and paste this prompt into opencode:

```markdown
I want to install the Telegram bot plugin manually. Guide me through these steps:

1. Check if opencode is installed
2. Ask for my Telegram bot token and chat ID
3. Create ~/.config/opencode-bot/.env with my credentials
4. Download the plugin from GitHub
5. Create opencode.json with plugin configuration
6. Set up 24/7 service (systemd on Linux, launchd on macOS)
7. Start the service and test it

Guide me one step at a time, waiting for confirmation before proceeding.
```

## Features

- Streaming responses with smart chunking
- Persistent sessions across restarts
- 60s timeout with automatic recovery
- Message queue (8 messages max)
- Auto-restart on crash
- Works on Linux and macOS

## Configuration

### Environment Variables

Create `~/.config/opencode-bot/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| TELEGRAM_BOT_TOKEN | Yes | Bot token from @BotFather |
| TELEGRAM_ALLOWLIST | Yes | Allowed chat IDs (comma-separated) |
| CI | Recommended | Set to true for non-interactive mode |

### Bot Commands

- /clear - Reset session and start fresh
- /session - Show current session ID
- /queue - Show pending messages

## Troubleshooting

**Bot not responding?** Check logs:
- Linux: `sudo journalctl -u opencode -f`
- macOS: `tail -f ~/.config/opencode-bot/opencode.log`

**Missing credentials error?** Make sure .env file exists at `~/.config/opencode-bot/.env`

## License

MIT
