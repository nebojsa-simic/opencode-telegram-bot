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
3. Create ~/.config/opencode/plugins/ directory
4. Clone https://github.com/nebojsa-simic/opencode-telegram-bot/ and copy src/telegram.ts to ~/.config/opencode/plugins/telegram.ts
5. Add plugin to ~/.config/opencode/opencode.json:
   - Create file if missing: {"$schema": "https://opencode.ai/config.json", "plugin": ["./plugins/telegram.ts"], "instructions": ["../opencode-bot/AGENTS.md"]}
   - Or add "./plugins/telegram.ts" to existing plugin array and "../opencode-bot/AGENTS.md" to instructions
6. Copy src/AGENTS.md to ~/.config/opencode-bot/AGENTS.md
7. **Restart opencode manually:** Once these steps complete, close this opencode session and restart it fresh
8. Test by sending a message to the bot on Telegram

Start with step 1. Guide me through each step, waiting for confirmation before proceeding.
```

opencode will walk you through the entire installation interactively.

---

### Option 2: Manual Installation

**1. Clone and copy:**

```bash
git clone https://github.com/nebojsa-simic/opencode-telegram-bot.git
cd opencode-telegram-bot

# Copy to config directories
mkdir -p ~/.config/opencode/plugins
mkdir -p ~/.config/opencode-bot
cp src/telegram.ts ~/.config/opencode/plugins/telegram.ts
cp src/AGENTS.md ~/.config/opencode-bot/AGENTS.md
```

**2. Create opencode.json config:**

```bash
cat > ~/.config/opencode/opencode.json << EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "plugin": ["./plugins/telegram.ts"],
  "instructions": ["../opencode-bot/AGENTS.md"]
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

## Uninstallation

To remove the plugin, paste this prompt into opencode:

```markdown
Uninstall the opencode-telegram-bot plugin for me. Do these steps in order:

1. Remove plugin files: ~/.config/opencode/plugins/telegram.ts and ~/.config/opencode-bot/AGENTS.md
2. Update ~/.config/opencode/opencode.json: remove "./plugins/telegram.ts" from plugin array and "../opencode-bot/AGENTS.md" from instructions
3. Optionally clean up: ~/.config/opencode-bot/.env (credentials), ~/.config/opencode-bot/telegram-sessions.json (sessions)
4. Optionally remove cloned repo directory
5. Tell me to restart opencode manually after these steps complete
6. Confirm uninstallation complete after restart

Start with step 1. Guide me through each step, waiting for confirmation before proceeding.
```

Or manually:
```bash
# Remove plugin files
rm ~/.config/opencode/plugins/telegram.ts
rm ~/.config/opencode-bot/AGENTS.md

# Edit ~/.config/opencode/opencode.json to remove plugin references
# Optionally remove credentials and session data
rm ~/.config/opencode-bot/.env
rm ~/.config/opencode-bot/telegram-sessions.json

# Then close and restart opencode manually
```

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Support

- 📖 [Documentation](https://github.com/nebojsa-simic/opencode-telegram-bot)
- 🐛 [Issues](https://github.com/nebojsa-simic/opencode-telegram-bot/issues)
- 💬 [Discussions](https://github.com/nebojsa-simic/opencode-telegram-bot/discussions)
