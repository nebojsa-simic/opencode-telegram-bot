import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import * as fs from "fs"
import * as path from "path"

function loadEnvFile() {
  const possiblePaths = [
    path.join(path.dirname(__dirname), ".env"),
    path.join(process.env.HOME || "", ".config", "opencode-bot", ".env"),
  ]
  
  for (const envPath of possiblePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8")
        content.split("\n").forEach(line => {
          const [key, ...valueParts] = line.split("=")
          if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join("=").trim()
          }
        })
        return
      }
    } catch {}
  }
}

loadEnvFile()

const SESSION_FILE = path.join(path.dirname(__dirname), "telegram-sessions.json")

function loadSessions(): Map<string, string> {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return new Map(Object.entries(JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"))))
    }
  } catch {}
  return new Map()
}

function saveSessions(sessions: Map<string, string>) {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(Object.fromEntries(sessions), null, 2))
  } catch {}
}

class DeltaTextBuffer {
  #threshold: number
  #chunks: string[] = []
  #byteLength = 0
  #encoder = new TextEncoder()

  constructor(threshold: number) {
    this.#threshold = threshold
  }

  push(delta: string) {
    if (!delta) return
    this.#chunks.push(delta)
    this.#byteLength += this.#encoder.encode(delta).length
  }

  isReady() {
    return this.#byteLength > this.#threshold
  }

  get(): string {
    if (this.#byteLength === 0) return ""

    const text = this.#chunks.join("")
    const hardCut = this.#indexAtByteLimit(text, this.#threshold)

    if (hardCut >= text.length) {
      this.#chunks = []
      this.#byteLength = 0
      return text
    }

    const softCut = this.#lastBoundaryBefore(text, hardCut)
    const cut = softCut ?? hardCut
    const out = text.slice(0, cut)
    const rest = text.slice(cut)

    this.#chunks = rest ? [rest] : []
    this.#byteLength = this.#encoder.encode(rest).length
    return out
  }

  #indexAtByteLimit(text: string, limit: number) {
    let bytes = 0
    let index = 0
    for (const ch of text) {
      const size = this.#encoder.encode(ch).length
      if (bytes + size > limit) break
      bytes += size
      index += ch.length
    }
    return index
  }

  #lastBoundaryBefore(text: string, endExclusive: number) {
    const candidate = text.slice(0, endExclusive)
    const pos = Math.max(candidate.lastIndexOf(","), candidate.lastIndexOf("."))
    return pos === -1 ? null : pos + 1
  }
}

interface QueuedMessage {
  chatId: string
  text: string
  replyTo?: number
}

const messageQueue: QueuedMessage[] = []
const streamingSessions: Record<string, { chatId: string, buffer: DeltaTextBuffer }> = {}
const chatSessions = loadSessions()
let isProcessing = false

export const TelegramPlugin: Plugin = async ({ client }) => {
  loadEnvFile()
  
  const CONFIG = {
    TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    ALLOWLIST: process.env.TELEGRAM_ALLOWLIST?.split(",") || []
  }

  if (!CONFIG.TOKEN || CONFIG.ALLOWLIST.length === 0) {
    return {
      tool: {
        telegram_send: tool({
          description: "Send a Telegram message (not configured)",
          args: { chatId: z.string() as any, message: z.string() as any },
          execute: async () => "Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_ALLOWLIST in ~/.config/opencode-bot/.env"
        })
      }
    }
  }

  const BOT_API = `https://api.telegram.org/bot${CONFIG.TOKEN}`
  let lastUpdateId = 0

  async function sendMessage(chatId: string, text: string, replyTo?: number) {
    if (!text) return
    try {
      await fetch(`${BOT_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, reply_to_message_id: replyTo })
      })
    } catch {}
  }

  async function getOrCreateSession(chatId: string): Promise<string> {
    const existing = chatSessions.get(chatId)
    if (existing) return existing
    
    const result = await client.session.create()
    const sessionId = result.data?.id
    if (!sessionId) throw new Error("Failed to create session")
    
    chatSessions.set(chatId, sessionId)
    saveSessions(chatSessions)
    return sessionId
  }

  async function processMessage(msg: QueuedMessage) {
    const { chatId, text, replyTo } = msg
    let sessionId: string | null = null
    
    try {
      sessionId = await getOrCreateSession(chatId)
      streamingSessions[sessionId] = { chatId, buffer: new DeltaTextBuffer(300) }
      
      await client.session.prompt({
        path: { id: sessionId },
        body: { parts: [{ type: "text", text }] }
      })
      
      const streaming = streamingSessions[sessionId]
      if (streaming) {
        const remainder = streaming.buffer.get()
        if (remainder.trim()) await sendMessage(chatId, remainder.trim(), replyTo)
        delete streamingSessions[sessionId]
      }
    } catch (error: any) {
      if (error.name === "AbortError" || error.message?.includes("timeout")) {
        await sendMessage(chatId, "That took too long. Try simplifying your request.", replyTo)
        try {
          sessionId = await getOrCreateSession(chatId)
          streamingSessions[sessionId] = { chatId, buffer: new DeltaTextBuffer(300) }
          await client.session.prompt({
            path: { id: sessionId },
            body: { parts: [{ type: "text", text: `Concise answer to: ${text.substring(0, 200)}` }] }
          })
          const streaming = streamingSessions[sessionId]
          if (streaming) {
            const remainder = streaming.buffer.get()
            if (remainder.trim()) await sendMessage(chatId, remainder.trim(), replyTo)
            delete streamingSessions[sessionId]
          }
        } catch {
          await sendMessage(chatId, "Still having trouble. Try again.", replyTo)
        }
      } else {
        await sendMessage(chatId, `❌ Error: ${error.message}`, replyTo)
      }
    } finally {
      isProcessing = false
    }
  }

  async function processQueue() {
    while (true) {
      if (messageQueue.length > 0 && !isProcessing) {
        isProcessing = true
        const msg = messageQueue.shift()
        if (msg) processMessage(msg)
      }
      await new Promise(r => setTimeout(r, 100))
    }
  }

  async function poll() {
    processQueue()
    
    while (true) {
      try {
        const res = await fetch(`${BOT_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`)
        const data = await res.json() as any
        if (!data.ok) continue
        
        for (const update of data.result || []) {
          lastUpdateId = update.update_id
          const msg = update.message
          if (!msg?.text) continue
          
          const chatId = msg.chat.id.toString()
          const text = msg.text.trim()
          const messageId = msg.message_id
          
          if (CONFIG.ALLOWLIST[0] !== chatId) {
            await sendMessage(chatId, "This bot is for a single user. Your chat ID is not authorized.", messageId)
            continue
          }
          
          if (text === "/clear" || text === "/reset" || text === "/new") {
            const oldSessionId = chatSessions.get(chatId)
            if (oldSessionId) {
              chatSessions.delete(chatId)
              saveSessions(chatSessions)
            }
            await sendMessage(chatId, "✅ Session cleared!", messageId)
            continue
          }
          
          if (text === "/session") {
            const sessionId = chatSessions.get(chatId)
            await sendMessage(chatId, sessionId ? `Session: \`${sessionId.substring(0, 20)}...\`` : "No active session", messageId)
            continue
          }
          
          await sendMessage(chatId, "🤔", messageId)
          
          if (messageQueue.length >= 8) messageQueue.shift()
          
          messageQueue.push({ chatId, text, replyTo: messageId })
        }
      } catch {
        await new Promise(r => setTimeout(r, 3000))
      }
    }
  }

  poll()

  const telegramSendTool = tool({
    description: "Send a proactive Telegram message",
    args: { chatId: z.string() as any, message: z.string() as any },
    execute: async ({ chatId, message }: any) => {
      if (CONFIG.ALLOWLIST[0] !== chatId) return `Error: Chat ${chatId} not authorized`
      await sendMessage(chatId, message)
      return "Sent"
    }
  })

  return {
    event: async (args: any) => {
      const event = args.event
      if (event.type !== "message.part.delta") return
      
      const props = event.properties || {}
      const sessionId = props.sessionID
      const delta = props.delta || ""
      const streaming = streamingSessions[sessionId]
      
      if (!streaming || !delta) return
      
      streaming.buffer.push(delta)
      
      if (streaming.buffer.isReady()) {
        const text = streaming.buffer.get()
        if (text.trim()) await sendMessage(streaming.chatId, text.trim())
      }
    },
    tool: { telegram_send: telegramSendTool }
  }
}
