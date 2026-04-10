# The Magic Installation Prompt ✨

**Here's the twist:** Instead of running a bash script, users just **paste this prompt into opencode** and opencode does all the work!

---

## Copy & Paste This Into opencode:

```markdown
I want to install the Telegram bot plugin. Please help me set it up by doing the following steps:

**Step 1: Create directory structure**
- Run: mkdir -p ~/.config/opencode-bot/plugins

**Step 2: Create .env file with my credentials**
- Ask me for my Telegram bot token (tell me to get it from @BotFather if I don't have one)
- Ask me for my Telegram chat ID (tell me to message the bot then visit: https://api.telegram.org/bot<TOKEN>/getUpdates)
- Create ~/.config/opencode-bot/.env with these values:
  ```
  TELEGRAM_BOT_TOKEN=<my_token>
  TELEGRAM_ALLOWLIST=<my_chat_id>
  ```

**Step 3: Create configuration files**
- Create ~/.config/opencode-bot/opencode.json with:
  ```json
  {
    "$schema": "https://opencode.ai/config.json",
    "plugin": [
      "./plugins/telegram.ts"
    ],
    "instructions": ["AGENTS.md"]
  }
  ```

**Step 4: Create AGENTS.md**
- Create ~/.config/opencode-bot/AGENTS.md with instructions for the bot (I'll provide the content)

**Step 5: Download the plugin**
- Download telegram.ts from: https://raw.githubusercontent.com/YOUR_USERNAME/telegram-bot-plugin/main/plugins/telegram.ts
- Save to: ~/.config/opencode-bot/plugins/telegram.ts

**Step 6: Enable persistent operation**
- Run: loginctl enable-linger $(whoami)
- Tell me this enables the bot to run 24/7 even when I log out

**Step 7: Create systemd service**
- Create a systemd service file at /etc/systemd/system/opencode.service
- Use my username in the service file
- Include these settings:
  - Restart=always
  - MemoryMax=2G
  - Environment=CI=true (for non-interactive mode)
  - Environment=OPENCODE_CONFIG_DIR=~/.config/opencode-bot

**Step 8: Start the service**
- Run: sudo systemctl daemon-reload
- Run: sudo systemctl enable opencode
- Run: sudo systemctl start opencode
- Show me the status with: sudo systemctl status opencode

**Step 9: Test it**
- Tell me to send a test message to my bot on Telegram
- If it responds, installation is complete!

Please guide me through each step one at a time and wait for my confirmation before proceeding. Start by asking if I have a Telegram bot token.
```

---

## Why This Approach?

✅ **Interactive** - opencode guides the user through setup  
✅ **Validates** - Can check if each step succeeded  
✅ **Educational** - User learns what's happening  
✅ **Customizable** - Can adjust based on user's system  
✅ **No separate script** - Everything happens in opencode  

---

## What Happens:

1. User clones/downloads this repo
2. Opens opencode
3. Pastes the prompt above
4. opencode:
   - Creates directories
   - Asks for credentials
   - Downloads plugin
   - Creates config files
   - Sets up systemd service
   - Starts the bot
5. **Done!** Bot is running 24/7

The installation **IS** an opencode conversation! 🤯
