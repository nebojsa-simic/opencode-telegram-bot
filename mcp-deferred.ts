import type { Plugin } from "@opencode-ai/plugin"

export const McpDeferredPlugin: Plugin = async ({ client }) => {
  const loadedServers = new Set<string>()
  
  return {
    "tool.execute.before": async (input: any, output: any) => {
      if (input.tool === "mcp_call" || input.tool === "mcp_tool") {
        const serverId = output.args.server || output.args.mcpServer
        
        if (serverId && !loadedServers.has(serverId)) {
          try {
            await (client.mcp as any).load(serverId)
            loadedServers.add(serverId)
          } catch (error) {
            console.error(`Failed to load MCP server ${serverId}:`, error)
          }
        }
      }
    }
  }
}
