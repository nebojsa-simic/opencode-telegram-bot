# opencode-telegram-bot

A production-ready Telegram bot plugin for opencode with streaming responses, persistent sessions, and smart timeout recovery.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Linux%20|%20macOS-blue)](https://github.com/nebojsa-simic/opencode-telegram-bot)

## Features

✨ **Streaming Responses** - Responses stream in real-time with clean 300-byte chunks and sentence boundaries  
🧠 **Persistent Sessions** - Conversations survive bot restarts (saved to telegram-sessions.json)  
⏱️ **60s Timeout + Smart Recovery** - Complex tasks don't hang forever; bot analyzes failures and adapts  
📬 **Message Queue** - Up to 8 messages queued, processed sequentially (no blocking)  
🛡️ **Auto-Restart** - systemd (Linux) or launchd (macOS) service with health monitoring  
💬 **Commands** - /clear, /reset, /new, /session, /queue  
🤖 **Non-Interactive** - CI=true mode skips all confirmations  
🧠 **Vector Memory** - SQLite-based semantic search with local embeddings  

## Installation

### The Magic Way (Recommended)

Copy and paste this entire prompt into opencode. It will guide you through the complete setup interactively:

**INSTALLATION PROMPT START**

I want to install a production-ready Telegram bot for opencode. Please help me set it up by following these steps IN ORDER. Wait for my confirmation after each step before proceeding.

**STEP 1: Check Prerequisites**  
First, verify opencode is installed by checking if ~/.opencode/bin/opencode exists. If not, tell me to install it from https://opencode.ai

**STEP 2: Get Telegram Credentials**  
Ask me for:  
1. My Telegram bot token (if I don't have one, guide me to message @BotFather on Telegram and send /newbot)  
2. My Telegram chat ID (tell me to message my bot, then visit https://api.telegram.org/bot<TOKEN>/getUpdates to find it)  

Wait for me to provide both values before continuing.

**STEP 3: Create Directory Structure**  
Run these commands:  
    mkdir -p ~/.config/opencode-bot/plugins

Show me the created directories and ask me to confirm before proceeding.

**STEP 4: Create .env File**  
Create the file ~/.config/opencode-bot/.env with this content (replace with my actual values):  
    TELEGRAM_BOT_TOKEN=<my_token>
    TELEGRAM_ALLOWLIST=<my_chat_id>
    CI=true

Show me the file content and ask me to confirm.

**STEP 5: Download Plugin Files**  
Download these files from https://github.com/nebojsa-simic/opencode-telegram-bot/tree/main/plugins:  
- telegram.ts → ~/.config/opencode-bot/plugins/telegram.ts  
- memory-sqlite.ts → ~/.config/opencode-bot/plugins/memory-sqlite.ts  
- mcp-deferred.ts → ~/.config/opencode-bot/plugins/mcp-deferred.ts  

If you can't download directly, ask me to clone the repo or download manually.  

Show me the downloaded files and ask me to confirm.

**STEP 6: Create AGENTS.md**  
Create ~/.config/opencode-bot/AGENTS.md with this content:  
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

Show me the file and ask me to confirm.

**STEP 7: Create opencode.json**  
Create ~/.config/opencode-bot/opencode.json with:  
    {
      "$schema": "https://opencode.ai/config.json",
      "plugin": [
        "./plugins/telegram.ts",
        "./plugins/memory-sqlite.ts",
        "./plugins/mcp-deferred.ts"
      ],
      "instructions": ["AGENTS.md"]
    }

Show me and ask me to confirm.

**STEP 8: Enable Persistent Operation**  
If on Linux: Run loginctl enable-linger $(whoami) and explain this allows 24/7 operation.  
If on macOS: Skip this step (launchd handles it differently).  

Show the output and ask me to confirm.

**STEP 9: Create System Service**  

For Linux (systemd):  
Create /etc/systemd/system/opencode.service with this content (replace YOUR_USERNAME with my actual username):  
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

To create this file, ask me to run:  
    sudo tee /etc/systemd/system/opencode.service > /dev/null << 'SERVICEEOF'
    <paste file content here>
    SERVICEEOF
    sudo systemctl daemon-reload

For macOS (launchd):  
Create ~/Library/LaunchAgents/com.opencode.bot.plist with this content:  
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
        <key>Label</key>
        <string>com.opencode.bot</string>
        <key>ProgramArguments</key>
        <array>
            <string>/Users/YOUR_USERNAME/.opencode/bin/opencode</string>
        </array>
        <key>WorkingDirectory</key>
        <string>/Users/YOUR_USERNAME</string>
        <key>RunAtLoad</key>
        <true/>
        <key>KeepAlive</key>
        <true/>
        <key>EnvironmentVariables</key>
        <dict>
            <key>OPENCODE_CONFIG_DIR</key>
            <string>/Users/YOUR_USERNAME/.config/opencode-bot</string>
            <key>CI</key>
            <string>true</string>
            <key>PATH</key>
            <string>/usr/local/bin:/usr/bin:/bin</string>
        </dict>
    </dict>
    </plist>

Then ask me to run:  
    launchctl load ~/Library/LaunchAgents/com.opencode.bot.plist

Show me which service was created and ask me to confirm.

**STEP 10: Start the Bot Service**  

For Linux:  
Guide me to run:  
    sudo systemctl enable opencode
    sudo systemctl start opencode
    sudo systemctl status opencode --no-pager

For macOS:  
Guide me to run:  
    launchctl load ~/Library/LaunchAgents/com.opencode.bot.plist
    launchctl list | grep opencode

Show me the status output. It should show the service is running.

**STEP 11: Test the Bot**  
Tell me to send a test message to my bot on Telegram (just say "hi" or "test").  

Then check the logs with me:  
Linux:  
    sudo journalctl -u opencode --since "2 minutes ago" -n 20

macOS:  
    tail -f ~/.config/opencode-bot/opencode.log

Look for:  
- "Telegram: Queued message from <chat_id>"  
- "Telegram: Processing message from <chat_id>"  
- "Telegram: Completed message from <chat_id>"  

If you see these, the bot is working!

**STEP 12: Verify Features**  
Tell me to test these commands by messaging the bot:  
1. Send any message → Should get streaming response with 🤔 emoji first  
2. Send /session → Should show session ID  
3. Send /queue → Should show queue status  
4. Send /clear → Should clear the session  

Ask me if everything works. If yes, installation is complete!

**Features to Mention at the End:**  
✅ Streaming responses (300-byte chunks)  
✅ Persistent sessions (survive restarts)  
✅ 60s timeout with smart recovery  
✅ Message queue (max 8 messages)  
✅ Auto-restart on crash  
✅ 24/7 operation (systemd on Linux, launchd on macOS)  
✅ Non-interactive mode (CI=true)

**INSTALLATION PROMPT END**

That's it! Paste the prompt above into opencode and it will guide you through everything.

### Manual Installation

#### 1. Clone the Repository
    git clone https://github.com/nebojsa-simic/opencode-telegram-bot.git
    cd opencode-telegram-bot

#### 2. Create Directory Structure
    mkdir -p ~/.config/opencode-bot/plugins

#### 3. Copy Plugin Files
    cp plugins/*.ts ~/.config/opencode-bot/plugins/
    cp AGENTS.md ~/.config/opencode-bot/
    cp .env.example ~/.config/opencode-bot/.env
    cp opencode.json.example ~/.config/opencode-bot/opencode.json

#### 4. Get Telegram Bot Token
1. Message @BotFather on Telegram
2. Send /newbot and follow prompts  
3. Copy the token (looks like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)  
4. Edit ~/.config/opencode-bot/.env and replace your_bot_token_here

#### 5. Get Your Chat ID
1. Message your new bot on Telegram  
2. Visit: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates  
3. Find your chat ID in the response (numeric string)  
4. Edit ~/.config/opencode-bot/.env and replace your_chat_id_here

#### 6. Enable 24/7 Operation

**Linux:**  
    loginctl enable-linger $(whoami)

**macOS:** Skip this step (launchd handles it automatically).

#### 7. Create System Service

**Linux (systemd):**  
    sudo cp opencode.service.example /etc/systemd/system/opencode.service
    sudo sed -i "s/YOUR_USERNAME/$(whoami)/g" /etc/systemd/system/opencode.service
    sudo systemctl daemon-reload

**macOS (launchd):**  
    cp opencode.plist.example ~/Library/LaunchAgents/com.opencode.bot.plist
    sed -i '' "s/YOUR_USERNAME/$(whoami)/g" ~/Library/LaunchAgents/com.opencode.bot.plist

#### 8. Start the Service

**Linux:**  
    sudo systemctl enable opencode
    sudo systemctl start opencode
    sudo systemctl status opencode

**macOS:**  
    launchctl load ~/Library/LaunchAgents/com.opencode.bot.plist
    launchctl list | grep opencode

#### 9. Test It

Send a message to your bot on Telegram!

## Configuration

### Environment Variables (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| TELEGRAM_BOT_TOKEN | ✅ | Bot token from @BotFather |
| TELEGRAM_ALLOWLIST | ✅ | Comma-separated chat IDs allowed to use bot |
| TELEGRAM_WEBHOOK_URL | ❌ | Public URL for webhooks (optional, uses polling by default) |

### Bot Commands

| Command | Description |
|---------|-------------|
| /clear, /reset, /new | Clear conversation history, start fresh session |
| /session | Show current session ID |
| /queue | Show pending messages in queue |

## Troubleshooting

### Bot not responding

**Linux:**  
    sudo systemctl status opencode
    sudo journalctl -u opencode --since "10 minutes ago"
    sudo systemctl restart opencode

**macOS:**  
    launchctl list | grep opencode
    tail -f ~/.config/opencode-bot/opencode.log
    launchctl unload ~/Library/LaunchAgents/com.opencode.bot.plist
    launchctl load ~/Library/LaunchAgents/com.opencode.bot.plist

### View logs

**Linux:**  
    sudo journalctl -u opencode -f

**macOS:**  
    tail -f ~/.config/opencode-bot/opencode.log

## License

MIT

## Credits

Built with:  
- opencode (https://opencode.ai) - AI coding assistant  
- Telegram Bot API (https://core.telegram.org/bots/api) - Bot platform  
- systemd (https://systemd.io/) / launchd (https://www.launchd.info/) - Service management
