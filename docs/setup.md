# Cursor Brain – Setup

## Prerequisites

- Node.js 18+
- Cursor IDE (or VS Code)
- (Optional) OpenAI API key for embeddings; without it, only FTS lexical search is used for retrieval.

## Install and build

```bash
cd cursor-brain
npm install
npm run compile
```

## Extension

1. **Load in Cursor**
   - Open the `cursor-brain` folder in Cursor, or
   - Run **Developer: Install Extension from Location...** and select the folder, or
   - Package: `npx @vscode/vsce package --no-dependencies` and install the generated `.vsix`.

2. **Settings (optional)**
   - `cursorBrain.storagePath`: Directory for `memory.db`. Leave empty to use the extension’s global storage.
   - `cursorBrain.openaiApiKey`: OpenAI API key for embeddings (or set `OPENAI_API_KEY` in the environment).
   - `cursorBrain.defaultMemoryType`: Default when using "Remember this" (`long_term_memory`, `session_memory`, or `project_memory`).
   - `cursorBrain.retrievalLimit`: Max memories returned by search (1–50).

## MCP server

So that the AI in Cursor can call `memory.search`, `memory.add`, etc., add the Cursor Brain MCP server.

### Option A: Cursor Settings UI

1. Open Settings (`Cmd + ,` / `Ctrl + ,`).
2. Go to **Tools & MCP** (or **MCP**).
3. Add new MCP server:
   - **Name**: `cursor-brain`
   - **Type**: Command
   - **Command**: `node`
   - **Args**: `["/absolute/path/to/cursor-brain/dist/mcp/server.js"]`
   - **Env** (optional):
     - `CURSOR_BRAIN_STORAGE_PATH`: Directory for the DB (default: `~/.cursor-brain/storage`).
     - `OPENAI_API_KEY`: For embeddings.

### Option B: Project-level config (`.cursor/mcp.json`)

Create or edit `.cursor/mcp.json` in your project (or user config) and add:

```json
{
  "mcpServers": {
    "cursor-brain": {
      "command": "node",
      "args": ["/absolute/path/to/cursor-brain/dist/mcp/server.js"],
      "env": {
        "CURSOR_BRAIN_STORAGE_PATH": "/path/to/your/storage",
        "OPENAI_API_KEY": "your-openai-key"
      }
    }
  }
}
```

Replace `/absolute/path/to/cursor-brain` with the real path to the built extension (where `dist/mcp/server.js` exists). Replace `/path/to/your/storage` and `your-openai-key` as desired. Restart Cursor after changing MCP config.

## Environment variables (MCP server)

| Variable | Description |
|----------|-------------|
| `CURSOR_BRAIN_STORAGE_PATH` | Directory containing `memory.db`. Default: `~/.cursor-brain/storage`. |
| `OPENAI_API_KEY` | Used for embedding content when adding/searching memory. |

## Verify

- **Extension**: Command palette → "Cursor Brain: Open storage folder". A folder should open; after "Remember this", `memory.db` will appear there (or in the path you set).
- **MCP**: In Cursor chat, ask the model to call `memory.stats`. It should return counts (e.g. `{"total":0,"byType":{}}` if empty).
