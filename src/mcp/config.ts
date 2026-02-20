import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const CONFIG_DIR = path.join(os.homedir(), ".cursor-brain");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export interface CursorBrainConfig {
  storagePath?: string;
  openaiApiKey?: string;
}

let cached: CursorBrainConfig | null | undefined = undefined;

export function loadConfig(): CursorBrainConfig {
  if (cached !== undefined) return cached ?? {};
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    cached = {
      storagePath: typeof parsed.storagePath === "string" ? parsed.storagePath.trim() : undefined,
      openaiApiKey: typeof parsed.openaiApiKey === "string" ? parsed.openaiApiKey.trim() : undefined,
    };
  } catch {
    cached = {};
  }
  return cached ?? {};
}

const DEFAULT_STORAGE = path.join(os.homedir(), ".cursor-brain", "storage");

export function getStoragePath(): string {
  const fromEnv = process.env.CURSOR_BRAIN_STORAGE_PATH?.trim();
  if (fromEnv) return fromEnv;
  const fromConfig = loadConfig().storagePath?.trim();
  if (fromConfig) return path.isAbsolute(fromConfig) ? fromConfig : path.join(os.homedir(), fromConfig);
  return DEFAULT_STORAGE;
}

export function getApiKey(): string {
  return (
    process.env.OPENAI_API_KEY?.trim() ??
    loadConfig().openaiApiKey ??
    ""
  );
}
