# Telegram Bot Installation Prompt

Copy and paste this entire block into opencode:

---

Install the opencode-telegram-bot plugin for me. Do these steps in order, asking for confirmation between each:

1. **Get my Telegram credentials:**
   - Help me get my bot token from @BotFather
   - Help me get my chat ID using the token
   - Wait for me to provide both values

2. **Create the .env file:**
   - Create `~/.config/opencode-bot/.env`
   - Add TELEGRAM_BOT_TOKEN and TELEGRAM_ALLOWLIST with my credentials
   - Set CI=true

3. **Create directories and copy plugin files:**
   - Create `~/.config/opencode/plugins/` directory
   - Create `~/.config/opencode-bot/` directory if it doesn't exist
   - Clone from https://github.com/nebojsa-simic/opencode-telegram-bot/
   - Copy telegram.ts to ~/.config/opencode/plugins/
   - Copy AGENTS.md to ~/.config/opencode-bot/

4. **Configure opencode.json:**
   - Check if `~/.config/opencode/opencode.json` exists
   - If it exists: add "./plugins/telegram.ts" to plugin array and "../opencode-bot/AGENTS.md" to instructions array
   - If it doesn't exist: create it with `{"$schema": "https://opencode.ai/config.json", "plugin": ["./plugins/telegram.ts"], "instructions": ["../opencode-bot/AGENTS.md"]}`

5. **Install dependencies:**
   - Run npm install in the cloned repo directory

6. **Restart opencode (manual step):**
   - Let opencode know these setup steps will complete in the current session
   - After completion, the user will close this opencode instance manually
   - Then start opencode fresh in a new session

7. **Test the bot:**
   - Send a test message to the bot on Telegram
   - Confirm I get a 🤔 response followed by an answer

Start with step 1. Guide me through each step, waiting for my confirmation before proceeding.
