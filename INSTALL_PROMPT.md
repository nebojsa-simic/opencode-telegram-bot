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

3. **Add plugin to opencode:**
   - Check if `~/.config/opencode/opencode.json` exists
   - Add `"plugin": ["github:nebojsa-simic/opencode-telegram-bot"]` to it
   - Create the file if it doesn't exist

4. **Install the plugin:**
   - Clone or download from github:nebojsa-simic/opencode-telegram-bot
   - Run npm install in the plugin directory

5. **Set up 24/7 service:**
   - Check if I'm on Linux or macOS
   - If Linux: run `loginctl enable-linger $(whoami)`
   - Download and run the setup-service.sh script OR set up systemd/launchd manually

6. **Test the bot:**
   - Verify the service is running
   - Have me send a test message on Telegram
   - Confirm I get a 🤔 response

Start with step 1. Guide me through each step, waiting for my confirmation before proceeding.
