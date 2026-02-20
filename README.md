# Cursor Brain

A persistent memory layer for Cursor IDE: store developer conversations and coding decisions, then retrieve relevant context automatically via hybrid (semantic + lexical) search. Works locally first with no cloud dependency.

## Features

- **Memory engine**: SQLite + FTS5 (lexical) + sqlite-vec (vector embeddings), hybrid ranking (BM25-style + cosine similarity).
- **Memory types**: `session_memory`, `long_term_memory`, `project_memory`.
- **MCP tools**: `memory.search`, `memory.add`, `memory.delete`, `memory.stats` so the AI can read and write memory.
- **VS Code extension**: "Remember this" (selection or file → memory), "Open storage folder", config for storage path and OpenAI API key.

## Architecture

- **Extension**: Commands and config; storage path; optional "Remember this" from editor.
- **MCP server**: Stdio server exposing four tools; uses same storage and embedding provider (OpenAI or stub).
- **Storage**: Single SQLite DB (`memory.db`) in a configurable directory (default: extension globalStorage or `~/.cursor-brain/storage` for MCP).

## Setup

1. **Install and build**
   ```bash
   npm install
   npm run compile
   ```

2. **Extension (Cursor/VS Code)**
   - Open the project in Cursor; run the Extension Development Host, or package and install the VSIX.
   - Set `cursorBrain.storagePath` and `cursorBrain.openaiApiKey` (or `OPENAI_API_KEY`) if you want embeddings for "Remember this".

3. **MCP server (for AI to use memory)**
   - Add the MCP server in Cursor (Settings → Tools & MCP, or `.cursor/mcp.json`).
   - Example config: see [docs/setup.md](docs/setup.md).

## Local testing

- **Run MCP server from CLI**
  ```bash
  npm run compile
  npm run mcp:run
  ```
  Then use an MCP client or Cursor with the server configured to run this command (with optional `CURSOR_BRAIN_STORAGE_PATH` and `OPENAI_API_KEY`).

- **Extension**
  - F5 in VS Code/Cursor to launch Extension Development Host; run "Cursor Brain: Remember this" with text selected; run "Cursor Brain: Open storage folder".

## Example usage

1. **Add memory**: In Cursor chat, ask the AI to remember something (it can call `memory.add`). Or select text and run "Cursor Brain: Remember this".
2. **Search**: In a later chat, ask a question; the AI can call `memory.search` with your question and use the returned context in its answer.
3. **Stats**: The AI can call `memory.stats` to report how many memories are stored.

See [docs/usage.md](docs/usage.md) for a short walkthrough.

## Docs

- [docs/setup.md](docs/setup.md) – Step-by-step setup and env vars.
- [docs/usage.md](docs/usage.md) – Example flows and MCP tool usage.

## License

MIT
