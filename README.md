# opencode-telegram-bot

A production-ready Telegram bot plugin for opencode with streaming responses, persistent sessions, and smart timeout recovery.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Linux%20|%20macOS-blue)](https://github.com/nebojsa-simic/opencode-telegram-bot)

## Installation

### Via npm (Recommended)

Add to your opencode.json:

```json
{
  "plugin": ["opencode-telegram-bot"]
}
```

Then create ~/.config/opencode-bot/.env with:
```
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_ALLOWLIST=your_chat_id_here
CI=true
```

### Via GitHub

Add to your opencode.json:

```json
{
  "plugin": ["github:nebojsa-simic/opencode-telegram-bot"]
}
```

### Manual Installation Prompt

Copy and paste this entire prompt into opencode to set up manually:

```markdown
I want to install the Telegram bot plugin for opencode. Guide me through these steps:

STEP 1: Check if opencode is installed at ~/.opencode/bin/opencode

STEP 2: Ask me for my Telegram bot token from @BotFather and my chat ID

STEP 3: Create directory ~/.config/opencode-bot/plugins

STEP 4: Create .env file at ~/.config/opencode-bot/.env with:
    TELEGRAM_BOT_TOKEN=<my_token>
    TELEGRAM_ALLOWLIST=<my_chat_id>
    CI=true

STEP 5: Download plugin files from GitHub to ~/.config/opencode-bot/plugins/

STEP 6: Create opencode.json at ~/.config/opencode-bot/ with plugin configuration

STEP 7: Enable 24/7 operation (loginctl enable-linger on Linux, skip on macOS)

STEP 8: Create systemd service (Linux) or launchd plist (macOS)

STEP 9: Start the service and verify it is running

STEP 10: Test by sending a message to the bot on Telegram

Guide me through each step one at a time, waiting for my confirmation before proceeding.
```

## Features

- Streaming responses with smart chunking
- Persistent sessions across restarts
- 60s timeout with automatic recovery
- Message queue (8 messages max)
- Auto-restart on crash
- Works on Linux and macOS

## Configuration

Create .env file with:

| Variable | Required | Description |
|----------|----------|-------------|
| TELEGRAM_BOT_TOKEN | Yes | Bot token from @BotFather |
| TELEGRAM_ALLOWLIST | Yes | Allowed chat IDs (comma-separated) |
| CI | Recommended | Set to true for non-interactive mode |

## Commands

- /clear - Reset session and start fresh
- /session - Show current session ID
- /queue - Show pending messages

## License

MIT
