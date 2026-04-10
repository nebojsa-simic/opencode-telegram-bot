# Publishing Your Telegram Bot Plugin 🚀

## Package Contents

Your plugin is ready to share! Here's what's in `/home/nsimic/telegram-bot-plugin/`:

```
telegram-bot-plugin/
├── plugins/
│   ├── telegram.ts              # Main bot plugin (streaming, queue, timeout)
│   ├── memory-sqlite.ts         # Vector memory with semantic search
│   └── mcp-deferred.ts          # MCP support
├── AGENTS.md                     # Bot instructions
├── .env.example                  # Environment template
├── opencode.json.example         # Config template
├── opencode.service.example      # Systemd service template
├── install.sh                    # Bash installer (traditional)
├── AUTOINSTALL_PROMPT.txt        # ⭐ The magic opencode prompt!
├── INSTALL_WITH_OPENDODE.md      # Documentation for the prompt approach
├── README.md                     # Full documentation
├── LICENSE                       # MIT license
├── package.json                  # npm/GitHub metadata
└── .gitignore                    # Git ignore file
```

## The "Twist" - Installation via Opencode Prompt

Instead of a boring install script, users **paste a prompt into opencode** and opencode does ALL the work:

1. User pastes `AUTOINSTALL_PROMPT.txt` into opencode
2. opencode guides them through setup interactively
3. opencode creates files, downloads plugins, configures everything
4. **Bot is running 24/7**

This is meta: **opencode installs itself as a Telegram bot!** 🤯

## Publishing Steps

### Option 1: GitHub Repository

1. **Create repo on GitHub:**
   ```bash
   cd /home/nsimic/telegram-bot-plugin
   git init
   git add .
   git commit -m "Initial release: Telegram bot plugin with streaming & timeout recovery"
   git remote add origin https://github.com/nebojsa-simic/opencode-telegram-bot.git
   git push -u origin main
   ```

2. **Update URLs in docs:**
   - Replace `YOUR_USERNAME` with your GitHub username in:
     - `AUTOINSTALL_PROMPT.txt`
     - `opencode.service.example`
     - `README.md`
     - `package.json`

3. **Add GitHub badge to README.md:**
   ```markdown
   [![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/opencode-telegram-bot)]()
   [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()
   ```

### Option 2: npm Package

1. **Update package.json:**
   - Set your username/version
   - Add keywords
   - Set repository URL

2. **Publish:**
   ```bash
   cd /home/nsimic/telegram-bot-plugin
   npm publish
   ```

3. **Users can install with:**
   ```bash
   npx opencode-telegram-bot
   ```

### Option 3: Direct Download

Just share the `/home/nsimic/telegram-bot-plugin/` folder via:
- ZIP file
- GitLab/Bitbucket
- Direct download link

## Marketing Your Plugin

### Key Features to Highlight

✨ **Unique Selling Points:**
- 🎯 Installation IS an opencode conversation (meta!)
- 📬 Message queue prevents blocking
- ⏱️ 60s timeout with smart recovery (no hangs)
- 🧠 Persistent sessions across restarts
- 🖥️ Runs 24/7 as systemd service
- 🚀 Streaming responses in real-time

### Where to Share

1. **opencode Discord/Community** - #plugins channel
2. **Reddit** - r/opencode, r/telegram, r/selfhosted
3. **Hacker News** - Show HN post
4. **Twitter/X** - Thread about the installation approach
5. **Dev.to/Medium** - Tutorial article

### Example Social Post

```
🤖 Just built a Telegram bot for @opencode_ai with a twist!

Instead of running an install script, you PASTE A PROMPT into opencode and it installs itself! 🤯

Features:
✅ Streaming responses
✅ 60s timeout + smart recovery
✅ Persistent sessions
✅ Message queue (no blocking)
✅ 24/7 systemd service

Install by pasting one prompt. That's it.

GitHub: [your-link-here]

#opencode #telegram #bot #ai #automation
```

## Support & Maintenance

### Create Issues Template

On GitHub, create `.github/ISSUE_TEMPLATE/bug_report.md`:
```markdown
**Bug Description**
What went wrong?

**Steps to Reproduce**
1. ...
2. ...

**Expected Behavior**
What should happen?

**Logs**
sudo journalctl -u opencode --since "1 hour ago"

**System Info**
- OS: 
- opencode version:
- Plugin version:
```

### Update Strategy

When you update the plugin:
1. Update version in `package.json`
2. Add changelog to `README.md`
3. Tag release on GitHub
4. Notify users via Discord/Twitter

## Monetization (Optional)

If you want to monetize:
- **GitHub Sponsors** - Link in README
- **Patreon** - Early access to features
- **Consulting** - Custom bot setup services
- **Donations** - Telegram bot token tip jar

## Legal

- ✅ MIT License (permissive, commercial-friendly)
- ✅ Credit required (keep copyright notice)
- ✅ No warranty (as-is)
- ✅ Can be used commercially

## Questions?

Common user questions:
- "Do I need coding skills?" → No, the prompt does everything!
- "Will it cost money?" → Free + your own server costs
- "Can I customize it?" → Yes, MIT license allows modifications
- "What if it breaks?" → Check logs with `journalctl -u opencode`

---

**Ready to publish?** 🚀

1. Create GitHub repo
2. Push the code
3. Share on social media
4. Watch the stars come in! ⭐
