import { execSync } from "child_process";

const REGEX_SLASH_TAG = /\/(\w+-\d+)/;
const REGEX_START_TAG = /^(\w+-\d+)/;
const REGEX_SLASH_NUM = /\/(\d+)/;
const REGEX_START_NUM = /^(\d+)/;
const REGEX_START_UND = /^([A-Z]+-[\[a-zA-Z\]\d]+)_/;
const REGEX_SLASH_UND = /\/([A-Z]+-[\[a-zA-Z\]\d]+)_/;

/**
 * Get the current Git branch name for the given repo path.
 */
export function getCurrentBranch(repoPath: string): string {
  try {
    return execSync("git branch --show-current", {
      cwd: repoPath,
      stdio: "pipe",
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

/**
 * Infer the commit type from the current branch name.
 * Matches patterns like `feat/...`, `fix-...`, `feat-...`, etc.
 */
export function inferTypeFromBranch(
  types: string[],
  repoPath: string
): string {
  const branch = getCurrentBranch(repoPath);
  if (!branch) {
    return "";
  }

  const found = types.find((t) => {
    if (!t) { return false; }
    const startDash = new RegExp(`^${t}-`);
    const betweenDash = new RegExp(`-${t}-`);
    const beforeSlash = new RegExp(`${t}/`);
    return [
      branch.match(startDash),
      branch.match(betweenDash),
      branch.match(beforeSlash),
    ].some((v) => v != null);
  });

  return found ?? "";
}

/**
 * Attempt to extract a ticket/issue identifier from the branch name.
 * Supports patterns like `feat/PROJ-123`, `PROJ-123_description`, `feat/123`, etc.
 */
export function inferTicketFromBranch(repoPath: string): string {
  const branch = getCurrentBranch(repoPath);
  if (!branch) {
    return "";
  }

  const matches: (RegExpMatchArray | null)[] = [
    branch.match(REGEX_START_UND),
    branch.match(REGEX_SLASH_UND),
    branch.match(REGEX_SLASH_TAG),
    branch.match(REGEX_SLASH_NUM),
    branch.match(REGEX_START_TAG),
    branch.match(REGEX_START_NUM),
  ];

  const found = matches
    .filter((v): v is RegExpMatchArray => v != null)
    .map((v) => (v.length >= 2 ? v[1] : ""));

  return found.length > 0 ? found[0] : "";
}
