import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { openStore } from "./memory/store.js";
import { createOpenAIEmbeddingProvider } from "./embeddings/openai.js";
import { createLocalEmbeddingProvider } from "./embeddings/local.js";
import * as ingestion from "./ingestion/index.js";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("cursorBrain.rememberThis", async () => {
      const storagePath = getStoragePath(context);
      const config = vscode.workspace.getConfiguration("cursorBrain");
      const apiKey = config.get<string>("openaiApiKey")?.trim() || process.env.OPENAI_API_KEY || "";
      const defaultType = (config.get<string>("defaultMemoryType") || "long_term_memory") as "session_memory" | "long_term_memory" | "project_memory";

      const editor = vscode.window.activeTextEditor;
      const content = editor
        ? (editor.selection.isEmpty ? editor.document.getText() : editor.document.getText(editor.selection))
        : "";
      if (!content.trim()) {
        vscode.window.showWarningMessage("Cursor Brain: Select text or open a file to remember.");
        return;
      }

      const db = openStore(storagePath);
      const embeddingProvider = apiKey ? createOpenAIEmbeddingProvider(apiKey) : createLocalEmbeddingProvider();
      try {
        const id = await ingestion.addMemory(db, embeddingProvider, {
          type: defaultType,
          content: content.trim(),
        });
        vscode.window.showInformationMessage(`Cursor Brain: Saved memory (${id}).`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        vscode.window.showErrorMessage(`Cursor Brain: ${msg}`);
      } finally {
        db.close();
      }
    }),
    vscode.commands.registerCommand("cursorBrain.openStorageFolder", () => {
      const storagePath = getStoragePath(context);
      fs.mkdirSync(storagePath, { recursive: true });
      const open = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
      require("child_process").exec(`${open} "${storagePath}"`);
    })
  );
}

function getStoragePath(context: vscode.ExtensionContext): string {
  const config = vscode.workspace.getConfiguration("cursorBrain");
  const configured = config.get<string>("storagePath")?.trim();
  if (configured) return path.isAbsolute(configured) ? configured : path.join(context.globalStoragePath, configured);
  return context.globalStoragePath;
}

export function deactivate(): void {}
