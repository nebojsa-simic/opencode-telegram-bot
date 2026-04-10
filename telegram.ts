import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import * as fs from "fs"
import * as path from "path"

function loadEnvFile() {
  // Try multiple locations for .env file
  const possiblePaths = [
    path.join(path.dirname(__dirname), ".env"),
    path.join(process.env.HOME || "", ".config", "opencode-bot", ".env"),
    path.join(process.env.HOME || "", ".config", "opencode", ".env"),
  ]
  
  for (const envPath of possiblePaths) {
    try {
      if (fs.existsSync(envPath)) {
        console.log(`Telegram plugin: Loading .env from ${envPath}`)
        const content = fs.readFileSync(envPath, "utf-8")
        content.split("\n").forEach(line => {
          const [key, ...valueParts] = line.split("=")
          if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join("=").trim()
          }
        })
        return
      }
    } catch (error) {
      console.error(`Failed to load .env from ${envPath}:`, error)
    }
  }
  console.log("Telegram plugin: No .env file found in expected locations")
}

loadEnvFile()

// Persisted session storage
const SESSION_FILE = path.join(path.dirname(__dirname), "telegram-sessions.json")

function loadSessions(): Map<string, string> {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"))
      return new Map(Object.entries(data))
    }
  } catch (e) {
    console.error("Failed to load sessions:", e)
  }
  return new Map()
}

function saveSessions(sessions: Map<string, string>) {
  try {
    const data = Object.fromEntries(sessions)
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error("Failed to save sessions:", e)
  }
}

class DeltaTextBuffer {
  #threshold: number
  #chunks: string[] = []
  #byteLength = 0
  #encoder = new TextEncoder()

  constructor(threshold: number) {
    if (!Number.isInteger(threshold) || threshold <= 0) {
      throw new TypeError("threshold must be a positive integer")
    }
    this.#threshold = threshold
  }

  push(delta: string) {
    if (typeof delta !== "string" || delta.length === 0) return
    this.#chunks.push(delta)
    this.#byteLength += this.#bytes(delta)
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
    this.#byteLength = this.#bytes(rest)

    return out
  }

  #bytes(str: string) {
    return this.#encoder.encode(str).length
  }

  #indexAtByteLimit(text: string, limit: number) {
    let bytes = 0
    let index = 0
    for (const ch of text) {
      const size = this.#bytes(ch)
      if (bytes + size > limit) break
      bytes += size
      index += ch.length
    }
    return index
  }

  #lastBoundaryBefore(text: string, endExclusive: number) {
    const candidate = text.slice(0, endExclusive)
    const comma = candidate.lastIndexOf(",")
    const period = candidate.lastIndexOf(".")
    const pos = Math.max(comma, period)
    return pos === -1 ? null : pos + 1
  }
}

// Message queue (max 8 messages)
interface QueuedMessage {
  chatId: string
  text: string
  timestamp: number
  replyTo?: number
}

const messageQueue: QueuedMessage[] = []
const MAX_QUEUE_SIZE = 8

// Active streaming sessions
const streamingSessions: Record<string, { chatId: string, buffer: DeltaTextBuffer }> = {}
// Persistent chat-to-session mapping
const chatSessions = loadSessions()
// Track if currently processing
let isProcessing = false

export const TelegramPlugin: Plugin = async ({ client }) => {
  // Reload env to get latest credentials
  loadEnvFile()
  
  const CONFIG = {
    TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    ALLOWLIST: process.env.TELEGRAM_ALLOWLIST?.split(",") || []
  }

  if (!CONFIG.TOKEN) {
    console.error("Telegram plugin: TELEGRAM_BOT_TOKEN not set!")
    console.error("Telegram plugin: Please create ~/.config/opencode-bot/.env with:")
    console.error("  TELEGRAM_BOT_TOKEN=your_bot_token_here")
    console.error("  TELEGRAM_ALLOWLIST=your_chat_id_here")
    console.error("Telegram plugin: Plugin will not function until credentials are set.")
    
    // Return a plugin that shows error on any Telegram command
    return {
      tool: {
        telegram_send: tool({
          description: "Send a Telegram message (not configured)",
          args: {
            chatId: z.string(),
            message: z.string()
          },
          execute: async () => {
            return "Telegram bot not configured. Please set TELEGRAM_BOT_TOKEN in ~/.config/opencode-bot/.env"
          }
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
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_to_message_id: replyTo
        })
      })
    } catch (e) {
      console.error("Telegram send error:", e)
    }
  }

  async function getOrCreateSession(chatId: string): Promise<string> {
    const existing = chatSessions.get(chatId)
    if (existing) {
      console.log(`Telegram: Reusing session ${existing.substring(0, 15)} for chat ${chatId}`)
      return existing
    }
    
    console.log(`Telegram: Creating new session for chat ${chatId}`)
    const result = await client.session.create()
    const sessionId = result.data?.id
    
    if (!sessionId) {
      throw new Error("Failed to create session")
    }
    
    chatSessions.set(chatId, sessionId)
    saveSessions(chatSessions)
    console.log(`Telegram: Session ${sessionId.substring(0, 15)} created for chat ${chatId}`)
    return sessionId
  }

  async function processMessage(msg: QueuedMessage) {
    const { chatId, text, replyTo } = msg
    
    try {
      const sessionId = await getOrCreateSession(chatId)
      streamingSessions[sessionId] = { chatId, buffer: new DeltaTextBuffer(300) }
      
      console.log(`Telegram: Processing message from ${chatId} (session: ${sessionId.substring(0, 15)})`)
      
      // 60-second timeout on prompt
      await client.session.prompt({
        path: { id: sessionId },
        body: { parts: [{ type: "text", text }] }
      }, { signal: AbortSignal.timeout(60000) })
      
      // Send final remainder
      const streaming = streamingSessions[sessionId]
      if (streaming) {
        const remainder = streaming.buffer.get()
        if (remainder.trim()) {
          await sendMessage(chatId, remainder.trim(), replyTo)
        }
        delete streamingSessions[sessionId]
      }
      
      console.log(`Telegram: Completed message from ${chatId}`)
      
    } catch (error: any) {
      console.error("Telegram processing error:", error)
      
      // Handle timeout
      if (error.name === "AbortError" || error.message?.includes("timeout")) {
        console.log(`Telegram: Timeout on message from ${chatId}, analyzing cause...`)
        
        // Analyze what might have caused the hang
        let recoveryMessage = "That took too long. "
        
        if (text.includes("http://") || text.includes("https://")) {
          recoveryMessage += "Network request likely timed out. Here's what I can do without external access: "
        } else if (text.includes("file") || text.includes("write") || text.includes("save")) {
          recoveryMessage += "File operation timed out. Let me provide the content directly instead: "
        } else if (text.includes("create") || text.includes("generate")) {
          recoveryMessage += "Generation timed out. Here's a condensed version: "
        } else {
          recoveryMessage += "Let me try a simpler approach: "
        }
        
        await sendMessage(chatId, recoveryMessage, replyTo)
        
        // Retry with simpler context
        try {
          const sessionId = await getOrCreateSession(chatId)
          const simplifiedPrompt = `Provide a concise answer (under 100 words) to: ${text.substring(0, 200)}`
          
          await client.session.prompt({
            path: { id: sessionId },
            body: { parts: [{ type: "text", text: simplifiedPrompt }] }
          }, { signal: AbortSignal.timeout(30000) })
          
          const streaming = streamingSessions[sessionId]
          if (streaming) {
            const remainder = streaming.buffer.get()
            if (remainder.trim()) {
              await sendMessage(chatId, remainder.trim(), replyTo)
            }
            delete streamingSessions[sessionId]
          }
        } catch (retryError) {
          console.error("Telegram: Recovery also failed:", retryError)
          await sendMessage(chatId, "Still having trouble. Try simplifying your request.", replyTo)
        }
      } else {
        // Other errors
        await sendMessage(chatId, `❌ Error: ${error.message}`, replyTo)
      }
    }
    
    isProcessing = false
  }

  async function processQueue() {
    while (true) {
      if (messageQueue.length > 0 && !isProcessing) {
        isProcessing = true
        const msg = messageQueue.shift()
        if (msg) {
          processMessage(msg) // Don't await - allow overlapping processing
        }
      }
      await new Promise(r => setTimeout(r, 100))
    }
  }

  async function poll() {
    console.log("Telegram polling started")
    console.log(`Telegram: Loaded ${chatSessions.size} persisted sessions`)
    
    // Start queue processor
    processQueue()
    
    while (true) {
      try {
        const res = await fetch(`${BOT_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`)
        const data = await res.json()
        if (!data.ok) continue
        
        for (const update of data.result || []) {
          lastUpdateId = update.update_id
          const msg = update.message
          if (!msg?.text) continue
          
          const chatId = msg.chat.id.toString()
          const text = msg.text.trim()
          const messageId = msg.message_id
          
          // Handle commands
          if (text === "/clear" || text === "/reset" || text === "/new") {
            const oldSessionId = chatSessions.get(chatId)
            if (oldSessionId) {
              chatSessions.delete(chatId)
              saveSessions(chatSessions)
              console.log(`Telegram: Cleared session ${oldSessionId.substring(0, 15)} for chat ${chatId}`)
            }
            await sendMessage(chatId, "✅ Session cleared! Starting fresh.", messageId)
            continue
          }
          
          if (text === "/session") {
            const sessionId = chatSessions.get(chatId)
            if (sessionId) {
              await sendMessage(chatId, `Session: \`${sessionId.substring(0, 20)}...\`\n_Persists across restarts_`, messageId)
            } else {
              await sendMessage(chatId, "No active session. One will be created with your next message.", messageId)
            }
            continue
          }
          
          if (text === "/queue") {
            await sendMessage(chatId, `Queue: ${messageQueue.length} message(s) pending`, messageId)
            continue
          }
          
          // Acknowledge receipt
          await sendMessage(chatId, "🤔", messageId)
          
          // Queue the message (max 8)
          if (messageQueue.length >= MAX_QUEUE_SIZE) {
            // Remove oldest if at capacity
            messageQueue.shift()
            console.log(`Telegram: Queue full, dropped oldest message`)
          }
          
          messageQueue.push({
            chatId,
            text,
            timestamp: Date.now(),
            replyTo: messageId
          })
          
          console.log(`Telegram: Queued message from ${chatId} (queue size: ${messageQueue.length})`)
        }
      } catch (e: any) {
        console.error("Telegram poll error:", e.message)
        await new Promise(r => setTimeout(r, 3000))
      }
    }
  }

  poll()

  const telegramSendTool = tool({
    description: "Send a proactive Telegram message",
    args: {
      chatId: z.string(),
      message: z.string()
    },
    execute: async ({ chatId, message }) => {
      if (CONFIG.ALLOWLIST.length > 0 && !CONFIG.ALLOWLIST.includes(chatId)) {
        return `Error: Chat ${chatId} not in allowlist`
      }
      await sendMessage(chatId, message)
      return "Sent"
    }
  })

  return {
    event: async ({ event }) => {
      if (event.type !== "message.part.delta") return
      
      const props = event.properties || {}
      const sessionId = props.sessionID
      const delta = props.delta || ""
      const streaming = streamingSessions[sessionId]
      
      if (!streaming || !delta) return
      
      streaming.buffer.push(delta)
      
      if (streaming.buffer.isReady()) {
        const text = streaming.buffer.get()
        if (text.trim()) {
          await sendMessage(streaming.chatId, text.trim())
        }
      }
    },
    tool: { telegram_send: telegramSendTool }
  }
}
