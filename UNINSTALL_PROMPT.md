# Telegram Bot Uninstallation Prompt

Copy and paste this entire block into opencode:

---

Uninstall the opencode-telegram-bot plugin for me. Do these steps in order, asking for confirmation between each:

1. **Stop opencode:**
   - Kill any running opencode instance: `pkill -f opencode`

2. **Remove plugin files:**
   - Remove `~/.config/opencode/plugins/telegram.ts`
   - Remove `~/.config/opencode-bot/AGENTS.md` (if it exists and was added by this plugin)

3. **Update opencode.json:**
   - Open `~/.config/opencode/opencode.json`
   - Remove "./plugins/telegram.ts" from the plugin array
   - Remove "../opencode-bot/AGENTS.md" from the instructions array
   - If the arrays are now empty, you can delete the file entirely

4. **Clean up optional files (ask first):**
   - `~/.config/opencode-bot/.env` (contains Telegram credentials)
   - `~/.config/opencode-bot/telegram-sessions.json` (cached session data)
   - `~/.config/opencode-bot/` directory (if empty after removal)

5. **Remove cloned repo (optional):**
   - Ask if I want to delete the cloned repository directory

6. **Confirm uninstallation:**
   - Verify plugin files are removed
   - Verify opencode.json is updated
   - Let me know the plugin is fully uninstalled

Start with step 1. Guide me through each step, waiting for my confirmation before proceeding. Be careful not to remove files that may have been added by other plugins.
