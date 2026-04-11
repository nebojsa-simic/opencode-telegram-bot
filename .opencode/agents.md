# Telegram Bot Plugin - Developer Guide

This guide is for developers working on the telegram-bot-plugin codebase.

## Architecture Decision: Single-User Design

**This bot supports exactly ONE user.** This is a deliberate design choice that:
- Eliminates race conditions in session management
- Simplifies concurrency control
- Reduces memory footprint
- Matches typical usage pattern (personal AI assistant)

**Enforcement:**
- `TELEGRAM_ALLOWLIST` must contain exactly one chat ID
- Startup validation rejects empty or multi-value allowlists
- Runtime checks reject messages from unauthorized chats
- `telegram_send` tool validates chat ID matches configured user

If multi-user support is needed, this codebase requires significant refactoring (session locking, per-user queues, etc.).

## Quick Start

### Local Testing
```bash
# 1. Ensure credentials exist
cat ~/.config/opencode-bot/.env

# 2. Link plugin locally (opencode.json in config dir)
{
  "plugin": ["./path/to/telegram-bot-plugin/telegram.ts"],
  "instructions": ["./path/to/telegram-bot-plugin/AGENTS.md"]
}

# 3. Restart opencode and message bot on Telegram
```

### Service Testing
```bash
# Check if running (Linux)
sudo systemctl status opencode-bot

# View live logs
sudo journalctl -u opencode-bot -f

# Restart after changes
sudo systemctl restart opencode-bot
```

## Architecture Overview

### Core Flow
```
Telegram Polling Loop (30s long-poll)
    ↓
Message Queue (max 8 pending)
    ↓
Session Manager (persistent to telegram-sessions.json)
    ↓
opencode session.prompt() with 60s timeout
    ↓
Stream deltas via message.part.delta events
    ↓
DeltaTextBuffer chunks (300 byte threshold)
    ↓
Send to Telegram API
```

### Key Files
| File | Purpose |
|------|---------|
| `telegram.ts` | Main plugin (432 lines) - polling, streaming, session mgmt |
| `mcp-deferred.ts` | Lazy-loads MCP servers on-demand |
| `setup-service.sh` | Auto-installs systemd/launchd service |
| `AGENTS.md` | Bot runtime instructions (loaded by opencode) |
| `.opencode/agents.md` | Developer guide (this file) |

## Code Conventions

### TypeScript Style
- No comments in production code (except JSDoc for exports)
- Use `console.log()` for debug output (prefixed with "Telegram: ")
- Use `console.error()` for errors
- Async/await only (no raw Promises)
- Type all function signatures

### Error Handling Pattern
```typescript
try {
  await client.session.prompt(..., { signal: AbortSignal.timeout(60000) })
} catch (error: any) {
  if (error.name === "AbortError" || error.message?.includes("timeout")) {
    // Analyze cause and retry with simplified prompt
  } else {
    // Send error to user
  }
}
```

### Streaming Pattern
```typescript
// DeltaTextBuffer handles chunking
const buffer = new DeltaTextBuffer(300) // 300 byte threshold
buffer.push(delta)
if (buffer.isReady()) {
  const chunk = buffer.get() // Smart boundary detection (commas, periods)
  await sendMessage(chatId, chunk.trim())
}
```

## Debugging Tips

### Common Issues

**Bot not responding:**
1. Check credentials: `cat ~/.config/opencode-bot/.env`
2. Check service: `sudo systemctl status opencode-bot`
3. Check logs: `sudo journalctl -u opencode-bot -f`

**Session not persisting:**
- Verify `telegram-sessions.json` exists in plugin directory
- Check file permissions

**Timeout errors:**
- Default: 60s timeout, retries with 30s + simplified prompt
- Check if external API calls or file operations are hanging
- Recovery logic analyzes error type (network, file, generation)

### Adding Debug Output
```typescript
console.log(`Telegram: Descriptive message with ${variable}`)
console.error(`Telegram: Error description:`, error)
```

## Testing Checklist

Before committing changes:
- [ ] Bot responds to messages on Telegram
- [ ] Sessions persist across restarts
- [ ] Timeout recovery works (test with long-running prompt)
- [ ] Commands work: /clear, /session, /queue
- [ ] Service restarts cleanly
- [ ] No memory leaks (check queue size stays ≤8)
- [ ] **Single-user enforcement works** (verify ALLOWLIST validation)

## Deployment

### Update Plugin
```bash
cd ~/telegram-bot-plugin
git pull
sudo systemctl restart opencode-bot
```

### Manual Service Setup
```bash
./setup-service.sh
```

## Configuration Locations

| Item | Path |
|------|------|
| Plugin credentials | `~/.config/opencode-bot/.env` |
| Bot runtime instructions | `~/.config/opencode-bot/AGENTS.md` |
| Session persistence | `~/.config/opencode-bot/telegram-sessions.json` |
| Service logs (Linux) | `journalctl -u opencode-bot` |
| Service logs (macOS) | `~/.config/opencode-bot/opencode.log` |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `TELEGRAM_ALLOWLIST` | Yes | Allowed chat IDs (comma-separated) |
| `CI` | Recommended | Set true for non-interactive mode |

## Recent Changes

- **Single-user enforcement** - Added startup validation and runtime checks
- Removed memory/SQLite features (moved to separate repo)
- Added `setup-service.sh` for easy 24/7 deployment
- Improved timeout recovery with error analysis
- Fixed streamingSessions memory leak on error paths
- Made AGENTS.md a template (chat ID from env var, not hardcoded)
