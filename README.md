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

**Copy and paste this entire prompt into opencode:**

```markdown
I want to install a production-ready Telegram bot for opencode. Please help me set it up by following these steps IN ORDER. Wait for my confirmation after each step before proceeding.

## STEP 1: Check Prerequisites
First, verify opencode is installed by checking if ~/.opencode/bin/opencode exists. If not, tell me to install it from https://opencode.ai

## STEP 2: Get Telegram Credentials
Ask me for:
1. My Telegram bot token (if I don't have one, guide me to message @BotFather on Telegram and send /newbot)
2. My Telegram chat ID (tell me to message my bot, then visit https://api.telegram.org/bot<TOKEN>/getUpdates to find it)

Wait for me to provide both values before continuing.

## STEP 3: Create Directory Structure
Run these commands:
```bash
mkdir -p ~/.config/opencode-bot/plugins
```

Show me the created directories and ask me to confirm before proceeding.

## STEP 4: Create .env File
Create the file ~/.config/opencode-bot/.env with this content (replace with my actual values):
```
TELEGRAM_BOT_TOKEN=<my_token>
TELEGRAM_ALLOWLIST=<my_chat_id>
CI=true
```

Show me the file content and ask me to confirm.

## STEP 5: Download Plugin Files
Download these files from https://github.com/nebojsa-simic/opencode-telegram-bot/tree/main/plugins:
- telegram.ts → ~/.config/opencode-bot/plugins/telegram.ts
- memory-sqlite.ts → ~/.config/opencode-bot/plugins/memory-sqlite.ts
- mcp-deferred.ts → ~/.config/opencode-bot/plugins/mcp-deferred.ts

If you can't download directly, ask me to clone the repo or download manually.

Show me the downloaded files and ask me to confirm.

## STEP 6: Create AGENTS.md
Create ~/.config/opencode-bot/AGENTS.md with this content:
```markdown
You are a Telegram bot assistant.

## Response Format
Always structure responses like this:
**THINKING:**
[Brief reasoning]
**ANSWER:**
[Your response]

## Guidelines
- Keep responses concise (under 200 words)
- Be friendly and conversational
- No code blocks unless requested
- Show thinking first, then answer

## Telegram Capabilities
You have access to telegram_send tool for proactive messaging.
Your chat ID is: <my_chat_id>
```

Show me the file and ask me to confirm.

## STEP 7: Create opencode.json
Create ~/.config/opencode-bot/opencode.json with:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "./plugins/telegram.ts",
    "./plugins/memory-sqlite.ts",
    "./plugins/mcp-deferred.ts"
  ],
  "instructions": ["AGENTS.md"]
}
```

Show me and ask me to confirm.

## STEP 8: Enable Persistent Operation
If on Linux: Run `loginctl enable-linger $(whoami)` and explain this allows 24/7 operation.
If on macOS: Skip this step (launchd handles it differently).

Show the output and ask me to confirm.

## STEP 9: Create System Service

### For Linux (systemd):
Create /etc/systemd/system/opencode.service with this content (replace YOUR_USERNAME with my actual username):
```ini
[Unit]
Description=Opencode Telegram Bot
After=network.target network-online.target

[Service]
Type=simple
User=YOUR_USERNAME
Group=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME
ExecStart=/home/YOUR_USERNAME/.opencode/bin/opencode
Restart=always
RestartSec=10
TimeoutStartSec=120
TimeoutStopSec=60
MemoryMax=2G
MemoryHigh=1536M
Environment=PATH=/home/YOUR_USERNAME/.opencode/bin:/usr/local/bin:/usr/bin:/bin
Environment=HOME=/home/YOUR_USERNAME
Environment=OPENCODE_CONFIG_DIR=/home/YOUR_USERNAME/.config/opencode-bot
Environment=NODE_NO_WARNINGS=1
Environment=CI=true
StandardOutput=journal
StandardError=journal
SyslogIdentifier=opencode-bot
KillMode=mixed
KillSignal=SIGTERM
SendSIGKILL=yes
FinalKillSignal=SIGKILL

[Install]
WantedBy=multi-user.target
```

To create this file, ask me to run:
```bash
sudo tee /etc/systemd/system/opencode.service > /dev/null << 'EOF'
<file content here>
