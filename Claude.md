# Claude.md - AI Assistant Guidelines

This file provides instructions for AI assistants (Claude, etc.) working in this repository.

## For AI Assistants

When helping with development in this repo:

1. **Read the developer guide first:** `.opencode/agents.md`
2. **Follow code conventions** outlined there
3. **Understand the architecture** before making changes
4. **Test changes** using the testing checklist

## For the Bot Runtime

The bot's runtime instructions are in `AGENTS.md` (root directory). This file is loaded by opencode when the plugin runs.

## Quick Reference

| File | Purpose | Audience |
|------|---------|----------|
| `AGENTS.md` | Bot runtime instructions | AI bot at runtime |
| `.opencode/agents.md` | Developer guide | Human developers + AI helpers |
| `README.md` | Installation + usage | End users |
| `CONTRIBUTING.md` | Contribution guidelines | Human contributors |

## Key Points for AI Assistants

- This is a **production Telegram bot plugin** for opencode
- Keep responses **concise and actionable**
- Always **verify before assuming** (use grep, glob, etc.)
- Follow the **error handling pattern** with timeout recovery
- Respect the **streaming chunking logic** (DeltaTextBuffer, 300 byte threshold)
- Sessions must **persist across restarts** (telegram-sessions.json)

## When Making Changes

1. Check `.opencode/agents.md` for conventions
2. Run through the testing checklist
3. Update this file if conventions change
