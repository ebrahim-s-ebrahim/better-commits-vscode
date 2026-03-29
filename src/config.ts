import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { BetterCommitsConfig, getDefaultConfig } from "./types";

const CONFIG_FILE_NAME = ".better-commits.json";

/** Optional warning handler — set by extension.ts to use VS Code notifications. */
let warnHandler: (msg: string) => void = (msg) => console.warn(msg);

export function setWarnHandler(handler: (msg: string) => void): void {
  warnHandler = handler;
}

export function loadConfig(workspaceRoot?: string): BetterCommitsConfig {
  const defaults = getDefaultConfig();

  // Load global config from home directory
  const globalPath = path.join(os.homedir(), CONFIG_FILE_NAME);
  const globalConfig = readConfigFile(globalPath);

  // Load repo config from workspace root
  let repoConfig: Partial<BetterCommitsConfig> | null = null;
  if (workspaceRoot) {
    const repoPath = path.join(workspaceRoot, CONFIG_FILE_NAME);
    repoConfig = readConfigFile(repoPath);
  }

  // Merge: defaults <- global <- repo (repo wins)
  const merged = deepMerge(defaults, globalConfig ?? {});
  return deepMerge(merged, repoConfig ?? {}) as BetterCommitsConfig;
}

function readConfigFile(filePath: string): Partial<BetterCommitsConfig> | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    warnHandler(`Better Commits: Could not read config at ${filePath}: ${err}`);
    return null;
  }
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal !== undefined &&
      srcVal !== null &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(tgtVal as any, srcVal as any);
    } else if (srcVal !== undefined) {
      result[key] = srcVal as T[keyof T];
    }
  }
  return result;
}
