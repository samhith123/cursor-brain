# Cursor Brain – Usage

## Adding memory

### From the editor

1. Select the text you want to remember (or leave nothing selected to use the whole file).
2. Run **Cursor Brain: Remember this** from the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
3. Memory is stored with the default type (e.g. `long_term_memory`) and no tags; embeddings are created if an OpenAI API key is set.

### Via the AI (MCP)

In Cursor chat you can say:

- “Remember this: we use Postgres for the main DB and Redis for sessions.”
- “Store this as project memory: API base URL is https://api.example.com.”

The model can call `memory.add` with:

- `type`: `session_memory` | `long_term_memory` | `project_memory`
- `content`: string to store
- `tags`: optional string array (e.g. `["auth", "postgres"]`)
- `file_refs`: optional file paths

## Searching memory

In a later conversation, ask something that should use past context, for example:

- “What did we decide about the database?”
- “Any notes on auth or sessions?”

The model can call `memory.search` with:

- `query`: natural language or keywords
- `limit`: optional, max 50 (default 10)
- `types`: optional filter by memory types

Results are returned as compressed text (summary + snippet) so they can be injected into the prompt. Hybrid search (FTS + vector) is used when embeddings are available; otherwise only lexical (FTS) search runs.

## Other MCP tools

- **memory.delete**: Delete by `id` (one) or `ids` (array). Use after `memory.search` or `memory.stats` if you want to remove specific entries.
- **memory.stats**: Returns `{ total, byType }` for counts. Useful to confirm storage or to describe memory state to the user.

## Example flow

1. You say: “Remember that we’re using Tailwind and shadcn/ui in this project.”
2. The model calls `memory.add` with that content and perhaps tags like `["frontend", "ui"]`.
3. Later you ask: “What UI stack are we using?”
4. The model calls `memory.search` with query “UI stack” or “Tailwind shadcn”, then uses the returned context in its answer.

## Storage location

- **Extension**: Uses `cursorBrain.storagePath` if set, otherwise the extension global storage directory.
- **MCP server**: Uses `CURSOR_BRAIN_STORAGE_PATH` if set, otherwise `~/.cursor-brain/storage`.

To share memory between the extension and the MCP server, point both to the same directory (e.g. set `cursorBrain.storagePath` and `CURSOR_BRAIN_STORAGE_PATH` to the same path).
