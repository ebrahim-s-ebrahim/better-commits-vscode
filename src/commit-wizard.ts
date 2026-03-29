import * as vscode from "vscode";
import {
  BetterCommitsConfig,
  CommitState,
  CommitTypeOption,
  CommitScopeOption,
  COMMIT_FOOTER_OPTIONS,
  CUSTOM_SCOPE_KEY,
  FooterOptionValue,
  createEmptyCommitState,
} from "./types";
import { loadConfig } from "./config";
import { inferTypeFromBranch, inferTicketFromBranch } from "./git-helpers";
import { buildCommitString, cleanCommitTitle } from "./commit-builder";

/**
 * Run the guided commit message wizard using VS Code Quick Picks and Input Boxes.
 * Returns the formatted commit string, or undefined if the user cancelled.
 */
export async function runCommitWizard(
  repoPath: string
): Promise<string | undefined> {
  const config = loadConfig(repoPath);
  const state = createEmptyCommitState();

  // ── Step 1: Commit Type ──────────────────────────────────────────
  if (config.commit_type.enable) {
    const typeResult = await pickCommitType(config, repoPath);
    if (typeResult === undefined) { return undefined; }
    state.type = typeResult.type;
    state.trailer = typeResult.trailer;
  }

  // ── Step 2: Commit Scope ─────────────────────────────────────────
  if (config.commit_scope.enable) {
    const scopeResult = await pickCommitScope(config);
    if (scopeResult === undefined) { return undefined; }
    state.scope = scopeResult;
  }

  // ── Step 3: Ticket / Issue ───────────────────────────────────────
  if (config.check_ticket.infer_ticket || config.check_ticket.confirm_ticket) {
    const ticketResult = await resolveTicket(config, repoPath);
    if (ticketResult === undefined) { return undefined; }
    state.ticket = ticketResult;
  }

  // ── Step 4: Commit Title ─────────────────────────────────────────
  const titleResult = await inputCommitTitle(config, state);
  if (titleResult === undefined) { return undefined; }

  // Handle emoji in title
  let titleWithEmoji = titleResult;
  if (config.commit_type.append_emoji_to_commit && config.commit_type.emoji_commit_position === "After-Colon") {
    const typeOption = config.commit_type.options.find(o => o.value === state.type);
    if (typeOption?.emoji) {
      titleWithEmoji = `${typeOption.emoji} ${titleResult}`;
    }
  }
  state.title = cleanCommitTitle(titleWithEmoji);

  // Handle emoji at start of type
  if (config.commit_type.append_emoji_to_commit && config.commit_type.emoji_commit_position === "Start") {
    const typeOption = config.commit_type.options.find(o => o.value === state.type);
    if (typeOption?.emoji) {
      state.type = `${typeOption.emoji} ${state.type}`.trim();
    }
  }

  // ── Step 5: Commit Body ──────────────────────────────────────────
  if (config.commit_body.enable) {
    const bodyResult = await inputCommitBody(config);
    if (bodyResult === undefined) { return undefined; }
    state.body = bodyResult;
    if (config.commit_body.split_by_period && state.body) {
      state.body = state.body
        .split(/\.\s+/)
        .map((s) => s.trim())
        .join(".\n");
    }
  }

  // ── Step 6: Footers ──────────────────────────────────────────────
  if (config.commit_footer.enable) {
    const footerResult = await pickFooters(config, state);
    if (footerResult === undefined) { return undefined; }
  }

  // ── Step 7: Hashtag on ticket ────────────────────────────────────
  if (
    config.check_ticket.prepend_hashtag === "Always" &&
    state.ticket &&
    !state.ticket.startsWith("#")
  ) {
    state.ticket = "#" + state.ticket;
  }

  return buildCommitString(state, config);
}

// ─── Quick Pick: Commit Type ──────────────────────────────────────────

interface TypePickResult {
  type: string;
  trailer: string;
}

async function pickCommitType(
  config: BetterCommitsConfig,
  repoPath: string
): Promise<TypePickResult | undefined> {
  const options = config.commit_type.options;

  // Infer type from branch if enabled
  let inferredType = "";
  if (config.commit_type.infer_type_from_branch) {
    const typeValues = options.map((o) => o.value);
    inferredType = inferTypeFromBranch(typeValues, repoPath);
  }

  const items: vscode.QuickPickItem[] = options.map((opt) => {
    const label = buildTypeLabel(opt, config);
    const isInferred = opt.value === inferredType;
    return {
      label,
      description: isInferred ? "(inferred from branch)" : (opt.hint ?? ""),
      detail: undefined,
      picked: false,
    };
  });

  const picked = await vscode.window.showQuickPick(items, {
    title: "Better Commits: Select commit type",
    placeHolder: inferredType
      ? `Type inferred from branch: ${inferredType}`
      : "Select a commit type",
  });

  if (!picked) { return undefined; }

  // Reverse-match to the original option
  const matchedOption = options.find(
    (opt) => buildTypeLabel(opt, config) === picked.label
  );
  const value = matchedOption?.value ?? "";
  const trailer = matchedOption?.trailer ?? "";

  return { type: value, trailer };
}

function buildTypeLabel(opt: CommitTypeOption, config: BetterCommitsConfig): string {
  const emoji =
    opt.emoji && config.commit_type.append_emoji_to_label
      ? `${opt.emoji} `
      : "";
  return `${emoji}${opt.label ?? opt.value}`;
}

// ─── Quick Pick: Commit Scope ─────────────────────────────────────────

async function pickCommitScope(
  config: BetterCommitsConfig
): Promise<string | undefined> {
  const options = [...config.commit_scope.options];

  // Add custom scope option if enabled
  if (
    config.commit_scope.custom_scope &&
    !options.some((o) => o.value === CUSTOM_SCOPE_KEY)
  ) {
    options.push({
      value: CUSTOM_SCOPE_KEY,
      label: CUSTOM_SCOPE_KEY,
      hint: "Write a custom scope",
    });
  }

  const items: vscode.QuickPickItem[] = options.map((opt) => ({
    label: opt.label ?? opt.value,
    description: opt.hint ?? "",
  }));

  const picked = await vscode.window.showQuickPick(items, {
    title: "Better Commits: Select commit scope",
    placeHolder: "Select a commit scope",
  });

  if (!picked) { return undefined; }

  const matchedOption = options.find(
    (opt) => (opt.label ?? opt.value) === picked.label
  );
  let scopeValue = matchedOption?.value ?? "";

  // If custom scope selected, prompt for input
  if (scopeValue === CUSTOM_SCOPE_KEY) {
    const customScope = await vscode.window.showInputBox({
      title: "Better Commits: Custom scope",
      prompt: "Write a custom scope",
      placeHolder: "e.g. auth, api, ui",
    });
    if (customScope === undefined) { return undefined; }
    scopeValue = customScope;
  }

  return scopeValue;
}

// ─── Ticket / Issue ───────────────────────────────────────────────────

async function resolveTicket(
  config: BetterCommitsConfig,
  repoPath: string
): Promise<string | undefined> {
  let ticket = "";

  // Attempt to infer from branch
  if (config.check_ticket.infer_ticket) {
    ticket = inferTicketFromBranch(repoPath);
    if (ticket && (config.check_ticket.append_hashtag || config.check_ticket.prepend_hashtag === "Prompt")) {
      ticket = "#" + ticket;
    }
  }

  // Confirm / edit ticket
  if (config.check_ticket.confirm_ticket) {
    const result = await vscode.window.showInputBox({
      title: "Better Commits: Ticket / Issue",
      prompt: ticket
        ? `Ticket inferred from branch (confirm or edit)`
        : "Add ticket / issue (optional)",
      value: ticket,
      placeHolder: "e.g. PROJ-123 or #42",
    });
    if (result === undefined) { return undefined; }
    return result;
  }

  return ticket;
}

// ─── Input: Commit Title ──────────────────────────────────────────────

async function inputCommitTitle(
  config: BetterCommitsConfig,
  state: CommitState
): Promise<string | undefined> {
  const maxSize = config.commit_title.max_size;

  const result = await vscode.window.showInputBox({
    title: "Better Commits: Commit title",
    prompt: `Write a brief title describing the commit (max ${maxSize} chars total)`,
    placeHolder: "e.g. add user authentication flow",
    validateInput: (value) => {
      if (!value) { return "Please enter a title"; }
      const scopeSize = state.scope ? state.scope.length + 2 : 0;
      const typeSize = state.type.length;
      const ticketSize = config.check_ticket.add_to_title
        ? state.ticket.length
        : 0;
      if (scopeSize + typeSize + ticketSize + value.length > maxSize) {
        return `Exceeded max length. Title max [${maxSize}]`;
      }
      return null;
    },
  });

  return result ?? undefined;
}

// ─── Input: Commit Body ───────────────────────────────────────────────

async function inputCommitBody(
  config: BetterCommitsConfig
): Promise<string | undefined> {
  const result = await vscode.window.showInputBox({
    title: "Better Commits: Commit body",
    prompt: config.commit_body.required
      ? "Write a detailed description of the changes"
      : "Write a detailed description of the changes (optional)",
    placeHolder: "Detailed description...",
    validateInput: (value) => {
      if (config.commit_body.required && !value) {
        return "Please enter a description";
      }
      return null;
    },
  });

  if (result === undefined) { return undefined; }
  return result || "";
}

// ─── Quick Pick: Footers ──────────────────────────────────────────────

async function pickFooters(
  config: BetterCommitsConfig,
  state: CommitState
): Promise<boolean | undefined> {
  const availableOptions = COMMIT_FOOTER_OPTIONS.filter((o) =>
    config.commit_footer.options.includes(o.value)
  );

  const items: vscode.QuickPickItem[] = availableOptions.map((opt) => ({
    label: opt.label,
    description: opt.hint,
    picked: config.commit_footer.initial_value.includes(opt.value),
  }));

  const picked = await vscode.window.showQuickPick(items, {
    title: "Better Commits: Select footers",
    placeHolder: "Select optional footers (Esc to skip)",
    canPickMany: true,
  });

  if (picked === undefined) { return undefined; }

  const selectedValues = picked.map((p) => {
    const match = availableOptions.find((o) => o.label === p.label);
    return match?.value;
  }).filter((v): v is FooterOptionValue => v !== undefined);

  // Handle breaking change
  if (selectedValues.includes("breaking-change")) {
    const breakingTitle = await vscode.window.showInputBox({
      title: "Breaking Changes: Title",
      prompt: "Write a short title / summary for the breaking change",
      validateInput: (v) => (v ? null : "Please enter a title / summary"),
    });
    if (breakingTitle === undefined) { return undefined; }
    state.breaking_title = breakingTitle;

    const breakingBody = await vscode.window.showInputBox({
      title: "Breaking Changes: Description",
      prompt: "Write a description & migration instructions (optional)",
    });
    if (breakingBody === undefined) { return undefined; }
    state.breaking_body = breakingBody || "";
  }

  // Handle deprecated
  if (selectedValues.includes("deprecated")) {
    const deprecatedTitle = await vscode.window.showInputBox({
      title: "Deprecated: Title",
      prompt: "Write a short title / summary",
      validateInput: (v) => (v ? null : "Please enter a title / summary"),
    });
    if (deprecatedTitle === undefined) { return undefined; }
    state.deprecates_title = deprecatedTitle;

    const deprecatedBody = await vscode.window.showInputBox({
      title: "Deprecated: Description",
      prompt: "Write a description (optional)",
    });
    if (deprecatedBody === undefined) { return undefined; }
    state.deprecates_body = deprecatedBody || "";
  }

  // Handle closes
  if (selectedValues.includes("closes")) {
    state.closes = "Closes:";
  }

  // Handle custom footer
  if (selectedValues.includes("custom")) {
    const customFooter = await vscode.window.showInputBox({
      title: "Custom Footer",
      prompt: "Write a custom footer",
    });
    if (customFooter === undefined) { return undefined; }
    state.custom_footer = customFooter || "";
  }

  // Handle trailer
  if (!selectedValues.includes("trailer")) {
    state.trailer = "";
  }

  return true;
}
