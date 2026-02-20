# Cursor Brain – Setup

## How it works

Cursor Brain is an **MCP server** that exposes four tools to the Cursor AI: `memory.search`, `memory.add`, `memory.delete`, and `memory.stats`. Cursor spawns the server (the `cursor-brain` command) and communicates over stdio. Memories are stored in a local SQLite database; search is hybrid (keyword via FTS5 + optional vector similarity when an API key is configured). No environment variables are required—storage defaults to `~/.cursor-brain/storage`, and optional settings go in `~/.cursor-brain/config.json`.

## Prerequisites

- Node.js 18+
- Cursor IDE

## Install

```bash
npm install -g cursor-brain
```

Or use without global install: in your MCP config, set **Command** to `npx` and **Args** to `["-y", "cursor-brain"]`.

## Add to Cursor

1. Open **Settings** → **Tools & MCP** (or **MCP**).
2. Add a new MCP server:
   - **Name**: `cursor-brain`
   - **Command**: `cursor-brain` (if installed globally), or **Command**: `npx` with **Args**: `["-y", "cursor-brain"]`
3. Restart Cursor.

**Or** create or edit **`.cursor/mcp.json`**:

```json
{
  "mcpServers": {
    "cursor-brain": {
      "command": "cursor-brain"
    }
  }
}
```

## Optional config

Create **`~/.cursor-brain/config.json`** to set:

- **storagePath**: Directory for `memory.db`. Default: `~/.cursor-brain/storage`.
- **openaiApiKey**: Optional. Enables semantic (vector) search; omit for keyword-only search.

Example:

```json
{
  "storagePath": "/path/to/storage",
  "openaiApiKey": "sk-..."
}
```

## From source

```bash
git clone https://github.com/samhith123/cursor-brain.git
cd cursor-brain
npm install
npm run compile
```

Then run `npm run mcp:run` or `cursor-brain`, and point Cursor’s MCP config at the `cursor-brain` command (or at `node /path/to/cursor-brain/dist/mcp/server.js`).

## Verify

In Cursor chat, ask the model to call **memory.stats**. It should return something like `{"total":0,"byType":{}}` if the server is connected and no memories are stored yet.
