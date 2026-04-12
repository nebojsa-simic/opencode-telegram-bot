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

3. **Clone and install the plugin:**
   - Clone from https://github.com/nebojsa-simic/opencode-telegram-bot/
   - Create `~/.config/opencode-bot/plugins/` directory
   - Copy telegram.ts to plugins/
   - Copy AGENTS.md to ~/.config/opencode-bot/
   - Run npm install in the cloned repo

4. **Add plugin to opencode:**
   - Check if `~/.config/opencode/opencode.json` exists
   - Add "./plugins/telegram.ts" to plugin array
   - Add "AGENTS.md" to instructions array
   - Create the file if it doesn't exist

5. **Restart opencode and test:**
   - Kill any running opencode instance
   - Restart opencode
   - Have me send a test message on Telegram
   - Confirm I get a 🤔 response

Start with step 1. Guide me through each step, waiting for my confirmation before proceeding.
