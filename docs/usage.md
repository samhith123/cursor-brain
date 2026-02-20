# Cursor Brain – Usage

## Adding memory

In Cursor chat you can say:

- “Remember this: we use Postgres for the main DB and Redis for sessions.”
- “Store this as project memory: API base URL is https://api.example.com.”

The model calls **memory.add** with:

- **type**: `session_memory` | `long_term_memory` | `project_memory`
- **content**: string to store
- **tags**: optional string array (e.g. `["auth", "postgres"]`)
- **file_refs**: optional file paths

## Searching memory

In a later conversation, ask something that should use past context, for example:

- “What did we decide about the database?”
- “Any notes on auth or sessions?”

The model calls **memory.search** with:

- **query**: natural language or keywords
- **limit**: optional, max 50 (default 10)
- **types**: optional filter by memory types

Results are returned as compressed text so the model can use them in its answer. Hybrid search (FTS + vector) runs when an API key is in config; otherwise only lexical (FTS) search is used.

## Other tools

- **memory.delete**: Delete by `id` (one) or `ids` (array). Use after `memory.search` or `memory.stats` to remove specific entries.
- **memory.stats**: Returns `{ total, byType }`. Use to confirm the server is working or to describe memory state to the user.

## Example flow

1. You say: “Remember that we’re using Tailwind and shadcn/ui in this project.”
2. The model calls **memory.add** with that content and tags like `["frontend", "ui"]`.
3. Later you ask: “What UI stack are we using?”
4. The model calls **memory.search** with a query like “UI stack” or “Tailwind shadcn”, then uses the returned context in its answer.

## Storage location

The MCP server stores `memory.db` in the directory given by **storagePath** in `~/.cursor-brain/config.json`, or in **`~/.cursor-brain/storage`** if no config is set.
