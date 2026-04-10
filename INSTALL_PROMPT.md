# Copy and paste this entire prompt into opencode:

---

I want to install the Telegram bot plugin for opencode. Please help me set it up step by step.

**What I need:**
1. Create directory structure at `~/.config/opencode-bot/` with subdirectories `plugins/`
2. Download the plugin files from: https://github.com/YOUR_USERNAME/telegram-bot-plugin/tree/main/plugins
   - telegram.ts (main bot plugin with streaming, queue, 60s timeout, smart recovery)
   - memory-sqlite.ts (local vector memory with semantic search)
   - mcp-deferred.ts (MCP support)
3. Create `~/.config/opencode-bot/.env` with my Telegram credentials
4. Create `~/.config/opencode-bot/opencode.json` with plugin configuration
5. Create `~/.config/opencode-bot/AGENTS.md` with bot instructions
6. Enable user linger so the bot runs 24/7: `loginctl enable-linger $(whoami)`
7. Create systemd service at `/etc/systemd/system/opencode.service` for auto-start
8. Guide me through getting a Telegram bot token from @BotFather
9. Help me find my chat ID
10. Start the bot service

**Important features I need:**
- Persistent sessions across restarts (save to telegram-sessions.json)
- Message queue (max 8 messages)
- 60-second timeout with smart recovery
- Streaming responses (300-byte chunks with sentence boundaries)
- Commands: /clear, /reset, /new, /session, /queue
- CI=true environment for non-interactive mode
- Auto-restart on crash

Please guide me through each step and wait for my confirmation before proceeding. Start by asking me for my Telegram bot token (or help me create a new bot with @BotFather).

---
