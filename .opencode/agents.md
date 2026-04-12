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
  "plugin": ["./path/to/telegram-bot-plugin/src/telegram.ts"],
  "instructions": ["./path/to/telegram-bot-plugin/src/AGENTS.md"]
}

# 3. Restart opencode and message bot on Telegram
```

### After Pushing Changes
Check CI status at https://github.com/nebojsa-simic/opencode-telegram-bot/actions
- Wait for all workflow runs to pass (tests + typecheck on Node 18, 20, 22)
- If CI fails, fix before deploying

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
| `src/telegram.ts` | Main plugin (~260 lines) - polling, streaming, session mgmt |
| `src/AGENTS.md` | Bot runtime instructions (loaded by opencode) |
| `.opencode/agents.md` | Developer guide (this file) |

## Code Conventions

### TypeScript Style
- No comments in production code (except JSDoc for exports)
- Async/await only (no raw Promises)
- Type all function signatures
- KISS principle - keep it simple, no unnecessary features

### Error Handling Pattern
```typescript
try {
  await client.session.prompt({...})
} catch (error: any) {
  if (error.name === "AbortError" || error.message?.includes("timeout")) {
    // Retry with simplified prompt
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
2. Check opencode is running: `pgrep -f opencode`
3. Restart opencode: `pkill -f opencode && opencode`

**Session not persisting:**
- Verify `telegram-sessions.json` exists in plugin directory
- Check file permissions

**Timeout errors:**
- Default: 60s timeout, retries with simplified prompt
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
- [ ] Commands work: /clear, /session
- [ ] No memory leaks (check queue size stays ≤8)
- [ ] **Single-user enforcement works** (verify ALLOWLIST validation)
- [ ] **CI passes** - tests + typecheck on Node 18, 20, 22

## Deployment

### Update Plugin
```bash
cd ~/telegram-bot-plugin
git pull
pkill -f opencode
opencode
```

### Verify Installation
```bash
# Check plugin files are in place
ls ~/.config/opencode/plugins/

# Verify credentials
cat ~/.config/opencode-bot/.env

# Test bot by sending a message on Telegram
```

## Configuration Locations

| Item | Path |
|------|------|
| Plugin credentials | `~/.config/opencode-bot/.env` |
| Bot runtime instructions | `~/.config/opencode-bot/AGENTS.md` |
| Session persistence | `~/.config/opencode-bot/telegram-sessions.json` |
| Plugin code | `~/.config/opencode/plugins/telegram.ts` |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `TELEGRAM_ALLOWLIST` | Yes | Allowed chat IDs (comma-separated) |
| `CI` | Recommended | Set true for non-interactive mode |

## Recent Changes

- **KISS simplification** - Removed mcp-deferred.ts, service setup, console.logs
- **CI/CD pipeline** - GitHub Actions with tests + typecheck on Node 18, 20, 22
- **Single-user enforcement** - Added startup validation and runtime checks
- Removed memory/SQLite features (moved to separate repo)
- Improved timeout recovery with error analysis
- Fixed streamingSessions memory leak on error paths
- Made AGENTS.md a template (chat ID from env var, not hardcoded)
