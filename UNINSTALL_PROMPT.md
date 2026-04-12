# Telegram Bot Uninstallation Prompt

Copy and paste this entire block into opencode:

---

Uninstall the opencode-telegram-bot plugin for me. Do these steps in order, asking for confirmation between each:

1. **Remove plugin files:**
   - Remove `~/.config/opencode/plugins/telegram.ts`
   - Remove `~/.config/opencode-bot/AGENTS.md` (if it exists and was added by this plugin)

2. **Update opencode.json:**
   - Open `~/.config/opencode/opencode.json`
   - Remove "./plugins/telegram.ts" from the plugin array
   - Remove "../opencode-bot/AGENTS.md" from the instructions array
   - If the arrays are now empty, you can delete the file entirely

3. **Clean up optional files (ask first):**
   - `~/.config/opencode-bot/.env` (contains Telegram credentials)
   - `~/.config/opencode-bot/telegram-sessions.json` (cached session data)
   - `~/.config/opencode-bot/` directory (if empty after removal)

4. **Remove cloned repo (optional):**
   - Ask if I want to delete the cloned repository directory

5. **Restart opencode:**
   - Let me know these uninstall steps are complete
   - Tell me to close this opencode session and restart fresh

6. **Confirm uninstallation:**
   - After I restart, verify the plugin is no longer loaded
   - Confirm the plugin is fully uninstalled

Start with step 1. Guide me through each step, waiting for my confirmation before proceeding. Be careful not to remove files that may have been added by other plugins.
