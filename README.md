# opencode-telegram-bot

A production-ready Telegram bot plugin for opencode with streaming responses, persistent sessions, and smart timeout recovery.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS-blue)](https://github.com/nebojsa-simic/opencode-telegram-bot)

## Features

✨ **Streaming Responses** - Responses stream in real-time with clean 300-byte chunks and sentence boundaries  
🧠 **Persistent Sessions** - Conversations survive bot restarts (saved to `telegram-sessions.json`)  
⏱️ **60s Timeout + Smart Recovery** - Complex tasks don't hang forever; bot analyzes failures and adapts  
📬 **Message Queue** - Up to 8 messages queued, processed sequentially (no blocking)  
🛡️ **Auto-Restart** - systemd (Linux) or launchd (macOS) service with health monitoring  
💬 **Commands** - `/clear`, `/reset`, `/new`, `/session`, `/queue`  
🤖 **Non-Interactive** - CI=true mode skips all confirmations  
🧠 **Vector Memory** - SQLite-based semantic search with local embeddings  

## Installation

### The Magic Way ✨ (Recommended)

**Copy and paste the entire content of `INSTALL_PROMPT.md` into opencode** and it will guide you through the entire setup interactively!

```bash
# Just copy this file and paste into opencode:
cat INSTALL_PROMPT.md
```

opencode will then:
1. Check prerequisites
2. Ask for your Telegram credentials
3. Create directory structure
4. Download plugin files
5. Configure everything
6. Set up systemd (Linux) or launchd (macOS)
7. Start the bot service
8. Test it with you

**The installation IS an opencode conversation!** 🤯

### Manual Installation

If you prefer to install manually:

#### 1. Clone the Repository

```bash
git clone https://github.com/nebojsa-simic/opencode-telegram-bot.git
cd opencode-telegram-bot
```

#### 2. Create Directory Structure

```bash
mkdir -p ~/.config/opencode-bot/plugins
```

#### 3. Copy Plugin Files

```bash
cp plugins/*.ts ~/.config/opencode-bot/plugins/
cp AGENTS.md ~/.config/opencode-bot/
cp .env.example ~/.config/opencode-bot/.env
cp opencode.json.example ~/.config/opencode-bot/opencode.json
```

#### 4. Get Telegram Bot Token

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow prompts
3. Copy the token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
4. Edit `~/.config/opencode-bot/.env` and replace `your_bot_token_here`

#### 5. Get Your Chat ID

1. Message your new bot on Telegram
2. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Find your chat ID in the response (numeric string)
4. Edit `~/.config/opencode-bot/.env` and replace `your_chat_id_here`

#### 6. Enable 24/7 Operation

**Linux:**
```bash
loginctl enable-linger $(whoami)
```

**macOS:** Skip this step (launchd handles it automatically).

#### 7. Create System Service

**Linux (systemd):**
```bash
sudo cp opencode.service.example /etc/systemd/system/opencode.service
sudo sed -i "s/YOUR_USERNAME/$(whoami)/g" /etc/systemd/system/opencode.service
sudo systemctl daemon-reload
```

**macOS (launchd):**
```bash
cp opencode.plist.example ~/Library/LaunchAgents/com.opencode.bot.plist
sed -i '' "s/YOUR_USERNAME/$(whoami)/g" ~/Library/LaunchAgents/com.opencode.bot.plist
```

#### 8. Start the Service

**Linux:**
```bash
sudo systemctl enable opencode
sudo systemctl start opencode
sudo systemctl status opencode
```

**macOS:**
```bash
launchctl load ~/Library/LaunchAgents/com.opencode.bot.plist
launchctl list | grep opencode
```

#### 9. Test It

Send a message to your bot on Telegram!

## Configuration

### Environment Variables (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Bot token from @BotFather |
| `TELEGRAM_ALLOWLIST` | ✅ | Comma-separated chat IDs allowed to use bot |
| `TELEGRAM_WEBHOOK_URL` | ❌ | Public URL for webhooks (optional, uses polling by default) |

### Bot Commands

| Command | Description |
|---------|-------------|
| `/clear`, `/reset`, `/new` | Clear conversation history, start fresh session |
| `/session` | Show current session ID |
| `/queue` | Show pending messages in queue |

### System Service Tuning

**Linux:** Edit `/etc/systemd/system/opencode.service`
- `MemoryMax` - Hard memory limit (default: 2G)
- `MemoryHigh` - Throttle threshold (default: 1.5G)
- `RestartSec` - Delay before restart on crash (default: 10s)

**macOS:** Edit `~/Library/LaunchAgents/com.opencode.bot.plist`
- Adjust EnvironmentVariables as needed

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Telegram  │────▶│  Poll Loop   │────▶│Message Queue│
└─────────────┘     └──────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐     ┌─────────────┐
                    │Session Mgmt  │     │  Processor  │
                    │ (Persistent) │     │(60s timeout)│
                    └──────────────┘     └─────────────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │   opencode  │
                                         │session.prompt│
                                         └─────────────┘
```

## Troubleshooting

### Bot not responding

**Linux:**
```bash
sudo systemctl status opencode
sudo journalctl -u opencode --since "10 minutes ago"
sudo systemctl restart opencode
```

**macOS:**
```bash
launchctl list | grep opencode
tail -f ~/.config/opencode-bot/opencode.log
launchctl unload ~/Library/LaunchAgents/com.opencode.bot.plist
launchctl load ~/Library/LaunchAgents/com.opencode.bot.plist
```

### Check queue status

Message your bot: `/queue`

### Clear stuck session

Message your bot: `/clear`

### View logs

**Linux:**
```bash
sudo journalctl -u opencode -f
```

**macOS:**
```bash
tail -f ~/.config/opencode-bot/opencode.log
```

## License

MIT - Feel free to fork, modify, and distribute!

## Credits

Built with:
- [opencode](https://opencode.ai) - AI coding assistant
- [Telegram Bot API](https://core.telegram.org/bots/api) - Bot platform
- [systemd](https://systemd.io/) / [launchd](https://www.launchd.info/) - Service management
