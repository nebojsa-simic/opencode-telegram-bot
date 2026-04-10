# opencode-telegram-bot

A production-ready Telegram bot plugin for opencode with streaming responses, persistent sessions, and smart timeout recovery.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start

### 1. Add Plugin

Add to your `opencode.json` (in ~/.config/opencode/ or project root):

```json
{
  "plugin": ["github:nebojsa-simic/opencode-telegram-bot"]
}
```

### 2. Create .env File

Create `~/.config/opencode-bot/.env` with:

```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ALLOWLIST=724085721
CI=true
```

### 3. Setup 24/7 Service

**Option A: Run setup script (Recommended)**
```bash
# Clone and run
git clone https://github.com/nebojsa-simic/opencode-telegram-bot.git
cd opencode-telegram-bot
./setup-service.sh
```

**Option B: Manual setup**

For Linux:
```bash
loginctl enable-linger $(whoami)
```

For macOS: Skip this step (launchd handles it automatically).

Then start opencode manually, or create a systemd/launchd service yourself.

### 4. Get Credentials

**Get your bot token:** Message @BotFather on Telegram, send /newbot

**Get your chat ID:** Message your bot, then visit: https://api.telegram.org/bot<TOKEN>/getUpdates

### 5. Restart opencode

**Done!** Send a message to your bot on Telegram.

## Manual Installation

If you prefer guided setup, copy and paste this prompt into opencode:

```markdown
I want to install the Telegram bot plugin manually. Guide me through:
1. Getting my Telegram bot token and chat ID
2. Creating ~/.config/opencode-bot/.env
3. Downloading the plugin
4. Setting up 24/7 service
5. Testing the bot

Guide me one step at a time.
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

**Bot not responding?**

1. Check if service is running:
   - Linux: `sudo systemctl status opencode-bot`
   - macOS: `launchctl list | grep opencode`

2. Check logs:
   - Linux: `sudo journalctl -u opencode-bot -f`
   - macOS: `tail -f ~/.config/opencode-bot/opencode.log`

3. Verify .env file exists at `~/.config/opencode-bot/.env`

**Credentials missing error?**

Make sure .env file has:
```
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_ALLOWLIST=your_chat_id_here
```

## License

MIT
