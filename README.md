# opencode-telegram-bot

A production-ready **single-user** Telegram bot plugin for opencode with streaming responses, persistent sessions, and smart timeout recovery.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/opencode-telegram-bot)](https://www.npmjs.com/package/opencode-telegram-bot)

## Features

- 📱 **Streaming responses** with smart chunking (300 byte threshold)
- 💾 **Persistent sessions** across restarts (saved to telegram-sessions.json)
- ⏱️ **60s timeout** with automatic recovery and simplified retry
- 📨 **Message queue** (max 8 pending messages)
- 🔒 **Single-user design** - only your chat ID is authorized
- 🖥️ **Cross-platform** - Linux (systemd), macOS (launchd), Windows
- ✅ **Tested** - comprehensive test suite for error paths

---

## Quick Start

### Option 1: Interactive Installation via opencode (Recommended)

**Paste this prompt into opencode:**

```markdown
Install the opencode-telegram-bot plugin for me. Do these steps in order, asking for confirmation between each:

1. Get my Telegram credentials (bot token from @BotFather, chat ID from getUpdates)
2. Create ~/.config/opencode-bot/.env with TELEGRAM_BOT_TOKEN, TELEGRAM_ALLOWLIST, CI=true
3. Clone https://github.com/nebojsa-simic/opencode-telegram-bot/ and copy telegram.ts to ~/.config/opencode-bot/plugins/
4. Add plugin path to ~/.config/opencode/opencode.json: "./plugins/telegram.ts"
5. Run npm install and restart opencode
6. Test the bot

Start with step 1. Guide me through each step, waiting for confirmation before proceeding.
```

opencode will walk you through the entire installation interactively.

---

### Option 2: npm Package

```bash
# Plugin will be auto-installed when opencode starts
# Add to your opencode.json:
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-telegram-bot"]
}
```

Then configure the plugin as shown below.

---

### Option 3: Manual Installation

**1. Clone and copy:**

```bash
git clone https://github.com/nebojsa-simic/opencode-telegram-bot.git
cd opencode-telegram-bot

# Copy to config directory
mkdir -p ~/.config/opencode-bot/plugins
cp telegram.ts ~/.config/opencode-bot/plugins/
cp AGENTS.md ~/.config/opencode-bot/
```

**2. Create config:**

```bash
cat > ~/.config/opencode-bot/opencode.json << EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "plugin": ["./plugins/telegram.ts"],
  "instructions": ["AGENTS.md"]
}
EOF
```

---

## Configuration

### 1. Get Telegram Credentials

**Bot Token:**
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot`
3. Follow prompts to create bot
4. Copy the token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

**Chat ID:**
1. Message your new bot (say "hi")
2. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Find `"chat":{"id":123456789}` - that's your chat ID

### 2. Create .env File

```bash
# Linux/macOS
mkdir -p ~/.config/opencode-bot
cat > ~/.config/opencode-bot/.env << EOF
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ALLOWLIST=724085721
CI=true
EOF

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\opencode-bot"
@"
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ALLOWLIST=724085721
CI=true
"@ | Out-File -FilePath "$env:APPDATA\opencode-bot\.env" -Encoding UTF8
```

> ⚠️ **Single-User Design:** This bot supports **exactly one user**. The `TELEGRAM_ALLOWLIST` must contain only your chat ID.

### 3. Restart opencode

```bash
# Kill existing opencode
pkill -f opencode

# Start fresh
opencode
```

---

## Usage

### Bot Commands

- `/clear` - Reset session and start fresh
- `/session` - Show current session ID  
- `/queue` - Show pending messages in queue

### Testing

Send a message to your bot on Telegram - it should respond with 🤔 followed by an answer.

Check logs for troubleshooting:

```bash
# Linux
sudo journalctl -u opencode-bot -f

# macOS  
tail -f ~/.config/opencode-bot/opencode.log

# Windows
Get-ScheduledTask -TaskName OpencodeBot | Get-ScheduledTaskInfo
```

---

## Troubleshooting

### Bot not responding?

1. **Check opencode is running:**
   ```bash
   pgrep -f opencode
   ```

2. **Verify .env file exists:**
   ```bash
   cat ~/.config/opencode-bot/.env
   ```

3. **Test credentials:**
   ```bash
   curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"
   ```

4. **Restart opencode:**
   ```bash
   pkill -f opencode
   opencode
   ```

### "Session timed out" errors?

- Long-running operations (>60s) will timeout
- Bot automatically retries with simplified prompt
- Try breaking complex requests into smaller steps

### Multiple users want to use the bot?

This bot is **single-user by design**. For multi-user support, you'd need to:
- Add session locking for concurrency
- Create per-user queues
- Handle rate limiting per user

Consider forking the repo if you need multi-user support.

---

## Development

### Clone and Setup

```bash
git clone https://github.com/nebojsa-simic/opencode-telegram-bot.git
cd opencode-telegram-bot
npm install
```

### Run Tests

```bash
npm test
```

Test coverage:
- ✅ Queue processor (isProcessing reset on errors)
- ✅ Streaming sessions (lifecycle management)
- ✅ Single-user enforcement (ALLOWLIST validation)

### Code Structure

| File | Purpose |
|------|---------|
| `telegram.ts` | Main plugin (polling, streaming, sessions) |
| `install.sh` | Cross-platform installer |
| `tests/` | Test suite |

### Making Changes

1. Edit `telegram.ts`
2. Run `npm test` to verify
3. Copy to config dir for testing:
   ```bash
   cp telegram.ts ~/.config/opencode-bot/plugins/
   ```
4. Test on Telegram
5. Commit and push

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Support

- 📖 [Documentation](https://github.com/nebojsa-simic/opencode-telegram-bot)
- 🐛 [Issues](https://github.com/nebojsa-simic/opencode-telegram-bot/issues)
- 💬 [Discussions](https://github.com/nebojsa-simic/opencode-telegram-bot/discussions)
