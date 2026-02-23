# Cursor Brain

An MCP (Model Context Protocol) server that gives Cursor IDE a **persistent memory layer**: store conversations and coding decisions, then have the AI retrieve relevant context automatically via hybrid (semantic + lexical) search. Works locally - no cloud required.

## How it works

1. **You add Cursor Brain as an MCP server** in Cursor. Cursor starts the `cursor-brain` process and talks to it over stdio.
2. **The AI gets four tools**: `memory_search`, `memory_add`, `memory_delete`, `memory_stats`. When you say things like "remember that we use Postgres" or "what did we decide about auth?", the model can call these tools.
3. **Memory is stored locally** in a SQLite database (default: `~/.cursor-brain/storage/memory.db`). Each entry has content, optional tags, and an optional embedding. Search uses:
   - **Lexical search** (FTS5) for keyword match - always works.
   - **Semantic search** (vector similarity) when you add an API key in `~/.cursor-brain/config.json` - improves relevance for natural-language queries.
4. **No env vars required.** Storage path and optional OpenAI key can be set in `~/.cursor-brain/config.json`; otherwise defaults are used and only lexical search runs.
5. **Add a Cursor rule** (e.g. in `.cursor/rules/`) so the AI is instructed to call `memory_search` when answering and `memory_add` when you ask to remember something. Then the agent uses Cursor Brain by default.

```text
# Integrate cursor-brain

Whenever generating answers or code:

- Before answering, call the MCP tool `memory_search` with the user's query (so the agent retrieves relevant memories).
- When the user asks to remember something, call the MCP tool `memory_add` with that content.
- Use `memory_delete` when the user requests forgetting something or cleaning up.
- Use `memory_stats` to gather internal memory metrics when helpful.
```

## Install

```bash
npm install -g @samhithgardas/cursor-brain
```

Or run without installing:

```bash
npx @samhithgardas/cursor-brain
```

## Configure Cursor

Add the MCP server so the AI can use the tools.

**Settings > Tools & MCP** (or **MCP**): add a new server with **Command**: `cursor-brain` (or **Command**: `npx`, **Args**: `["-y", "@samhithgardas/cursor-brain"]`).

Or edit `~/.cursor/mcp.json` (user) or `.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "cursor-brain": {
      "command": "npx",
      "args": ["-y", "@samhithgardas/cursor-brain"]
    }
  }
}
```

Restart Cursor after changing MCP config.

## Optional config

To use a custom storage path or enable semantic search (embeddings), create `~/.cursor-brain/config.json`:

```json
{
  "storagePath": "/path/to/storage",
  "openaiApiKey": "sk-..."
}
```

- **storagePath**: Where `memory.db` lives. Omit to use `~/.cursor-brain/storage`.
- **openaiApiKey**: Optional. If set, enables vector search; if omitted, only keyword (FTS) search is used.

## MCP tools

| Tool              | Description                                                                       |
| ----------------- | --------------------------------------------------------------------------------- |
| **memory_search** | Hybrid search; returns relevant memories for a query.                             |
| **memory_add**    | Store a memory (type: `session_memory`, `long_term_memory`, or `project_memory`). |
| **memory_delete** | Delete by id or ids.                                                              |
| **memory_stats**  | Return total count and counts by type.                                            |

## Make the AI use it by default

Add a Cursor rule (e.g. `.cursor/rules/cursor-brain.mdc`) with `alwaysApply: true` that tells the agent to:

- Call **memory_search** with the user's question when answering, to pull in relevant past context.
- Call **memory_add** when the user asks to remember something or when recording an important decision.

See [docs/usage.md](docs/usage.md) for example prompts and flows.

## From source

```bash
git clone https://github.com/samhith123/cursor-brain.git
cd cursor-brain
npm install
npm run build
```

Run the server with `npm run mcp:run` or `cursor-brain`, and point Cursor's MCP config at the `cursor-brain` command (or at `node /path/to/cursor-brain/dist/mcp/server.js`).

## Changelog

### 0.1.6
- **Breaking**: Tool names changed from dot notation (`memory.search`) to underscore notation (`memory_search`) for better MCP compatibility
- Updated documentation to reflect new tool names

### 0.1.5
- Added embedding dimension tracking
- Improved local embeddings support

## Docs

- [docs/setup.md](docs/setup.md) - Setup and config.
- [docs/usage.md](docs/usage.md) - Example usage and flows.

## License

MIT. See [LICENSE](LICENSE). Copyright (c) 2026 Samhith Gardas.
