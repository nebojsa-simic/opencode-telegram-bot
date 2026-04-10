import type { Plugin } from "@opencode-ai/plugin"
import { Database } from "bun:sqlite"

export const MemorySqlitePlugin: Plugin = async ({ client, $ }) => {
  const DB_PATH = "~/.config/opencode/memory.db"
  const LM_STUDIO_PATH = "/usr/local/bin/lmstudio"
  const EMBEDDING_MODEL = "text-embedding-nomic-embed-text-v1.5"
  const EMBEDDING_DIM = 768
  
  let lmStudioStarted = false
  const db = new Database(DB_PATH)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      embedding BLOB NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key)`)
  
  async function ensureLmStudio() {
    if (lmStudioStarted) return true
    
    try {
      const res = await fetch("http://localhost:1234/v1/models")
      if (res.ok) {
        lmStudioStarted = true
        return true
      }
    } catch {}
    
    try {
      await $`Xvfb :99 -screen 0 1024x768x24 &`
      await $`${LM_STUDIO_PATH} --headless --port 1234 --no-sandbox &`
      await $`sleep 10`
      lmStudioStarted = true
      return true
    } catch (error) {
      console.error("Failed to start LM Studio:", error)
      return false
    }
  }
  
  async function getEmbedding(text: string): Promise<Float32Array> {
    const running = await ensureLmStudio()
    if (!running) {
      throw new Error("LM Studio not available for embeddings")
    }
    
    const res = await fetch("http://localhost:1234/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text
      })
    })
    
    if (!res.ok) {
      throw new Error(`LM Studio embedding failed: ${res.statusText}`)
    }
    
    const data = await res.json()
    const embedding = data.data[0].embedding as number[]
    
    const buffer = new Float32Array(embedding)
    return buffer
  }
  
  function cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
  
  return {
    "tool.execute.before": async (input, output) => {
      switch (input.tool) {
        case "memory_store": {
          const { key, content } = output.args
          const embedding = await getEmbedding(content)
          const embeddingBuffer = Buffer.from(embedding.buffer)
          
          db.run(
            `INSERT OR REPLACE INTO memories (key, content, embedding, updated_at) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [key, content, embeddingBuffer]
          )
          output.result = `Memory stored: ${key}`
          break
        }
        
        case "memory_recall": {
          const { key } = output.args
          const row: any = db.get(`SELECT content FROM memories WHERE key = ?`, [key])
          output.result = row?.content || null
          break
        }
        
        case "memory_search": {
          const { query, limit = 5 } = output.args
          const queryEmbedding = await getEmbedding(query)
          
          const rows: any[] = db.all(`SELECT key, content, embedding FROM memories`)
          
          const results = rows.map(row => {
            const storedEmbedding = new Float32Array(
              Buffer.from(row.embedding).buffer
            )
            return {
              key: row.key,
              content: row.content,
              similarity: cosineSimilarity(queryEmbedding, storedEmbedding)
            }
          })
          
          results.sort((a, b) => b.similarity - a.similarity)
          output.result = results.slice(0, limit)
          break
        }
        
        case "memory_forget": {
          const { key } = output.args
          db.run(`DELETE FROM memories WHERE key = ?`, [key])
          output.result = `Memory deleted: ${key}`
          break
        }
      }
    }
  }
}
