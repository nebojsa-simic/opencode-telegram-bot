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

### Option 1: Automatic Installer (Recommended)

**Linux, macOS, Windows (Git Bash/WSL):**

```bash
curl -fsSL https://raw.githubusercontent.com/nebojsa-simic/opencode-telegram-bot/main/install.sh | bash
```

The installer will:
- Clone the repository
- Copy plugin files to your config directory
- Create config templates
- Optionally set up 24/7 service (systemd/launchd)

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
cp mcp-deferred.ts ~/.config/opencode-bot/plugins/
cp AGENTS.md ~/.config/opencode-bot/
```

**2. Create config:**

```bash
cat > ~/.config/opencode-bot/opencode.json << EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "plugin": [
    "./plugins/mcp-deferred.ts",
    "./plugins/telegram.ts"
  ],
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

### 3. Set Up 24/7 Service (Optional)

**Linux (systemd):**

```bash
# Create service file
sudo tee /etc/systemd/system/opencode-bot.service > /dev/null << EOF
[Unit]
Description=Opencode Telegram Bot
After=network.target network-online.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$HOME
ExecStart=$HOME/.opencode/bin/opencode
Restart=always
RestartSec=10
MemoryMax=2G
MemoryHigh=1536M
Environment=OPENCODE_CONFIG_DIR=$HOME/.config/opencode-bot
Environment=CI=true

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable opencode-bot
sudo systemctl start opencode-bot

# Check status
sudo systemctl status opencode-bot
sudo journalctl -u opencode-bot -f
```

**macOS (launchd):**

```bash
# Create plist file
mkdir -p ~/Library/LaunchAgents
cat > ~/Library/LaunchAgents/com.opencode.bot.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.opencode.bot</string>
    <key>ProgramArguments</key>
    <array>
        <string>$HOME/.opencode/bin/opencode</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$HOME</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>OPENCODE_CONFIG_DIR</key>
        <string>$HOME/.config/opencode-bot</string>
        <key>CI</key>
        <string>true</string>
    </dict>
</dict>
</plist>
EOF

# Load service
launchctl load ~/Library/LaunchAgents/com.opencode.bot.plist

# Check status
launchctl list | grep opencode
```

**Windows (Task Scheduler):**

```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "$env:USERPROFILE\.opencode\bin\opencode.exe"
$trigger = New-ScheduledTaskTrigger -AtLogon
$settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
$envVars = @()
$envVars += New-ScheduledTaskAction -Execute "setx" -Argument "OPENCODE_CONFIG_DIR `"$env:APPDATA\opencode-bot`""

Register-ScheduledTask -TaskName "OpencodeBot" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest
```

### 4. Restart opencode

If not running as a service:

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

1. **Check service status:**
   ```bash
   # Linux
   sudo systemctl status opencode-bot
   
   # macOS
   launchctl list | grep opencode
   ```

2. **Verify .env file exists:**
   ```bash
   cat ~/.config/opencode-bot/.env
   ```

3. **Check logs:**
   ```bash
   # Linux
   sudo journalctl -u opencode-bot -f
   
   # macOS
   tail -f ~/.config/opencode-bot/opencode.log
   ```

4. **Test credentials:**
   ```bash
   curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"
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
| `mcp-deferred.ts` | Lazy-loads MCP servers on-demand |
| `install.sh` | Cross-platform installer |
| `tests/` | Test suite |

### Making Changes

1. Edit `telegram.ts`
2. Run `npm test` to verify
3. Copy to config dir for testing:
   ```bash
   cp telegram.ts ~/.config/opencode-bot/plugins/
   sudo systemctl restart opencode-bot
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
