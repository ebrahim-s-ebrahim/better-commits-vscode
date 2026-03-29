/**
 * TypeScript types and defaults ported from better-commits valibot schemas.
 * Maintains .better-commits.json config compatibility.
 */

// ─── Commit Type Options ────────────────────────────────────────────

export interface CommitTypeOption {
  value: string;
  label?: string;
  hint?: string;
  emoji?: string;
  trailer?: string;
}

export const DEFAULT_TYPE_OPTIONS: CommitTypeOption[] = [
  { value: "feat",     label: "feat",     hint: "A new feature",                                              emoji: "🌟", trailer: "Changelog: feature" },
  { value: "fix",      label: "fix",      hint: "A bug fix",                                                  emoji: "🐛", trailer: "Changelog: fix" },
  { value: "docs",     label: "docs",     hint: "Documentation only changes",                                 emoji: "📚", trailer: "Changelog: documentation" },
  { value: "refactor", label: "refactor", hint: "A code change that neither fixes a bug nor adds a feature",  emoji: "🔨", trailer: "Changelog: refactor" },
  { value: "perf",     label: "perf",     hint: "A code change that improves performance",                    emoji: "🚀", trailer: "Changelog: performance" },
  { value: "test",     label: "test",     hint: "Adding missing tests or correcting existing tests",          emoji: "🚨", trailer: "Changelog: test" },
  { value: "build",    label: "build",    hint: "Changes that affect the build system or external dependencies", emoji: "🚧", trailer: "Changelog: build" },
  { value: "ci",       label: "ci",       hint: "Changes to our CI configuration files and scripts",          emoji: "🤖", trailer: "Changelog: ci" },
  { value: "chore",    label: "chore",    hint: "Other changes that do not modify src or test files",         emoji: "🧹", trailer: "Changelog: chore" },
  { value: "",         label: "none" },
];

// ─── Commit Scope Options ───────────────────────────────────────────

export interface CommitScopeOption {
  value: string;
  label?: string;
  hint?: string;
}

export const DEFAULT_SCOPE_OPTIONS: CommitScopeOption[] = [
  { value: "app",    label: "app" },
  { value: "shared", label: "shared" },
  { value: "server", label: "server" },
  { value: "tools",  label: "tools" },
  { value: "",       label: "none" },
];

export const CUSTOM_SCOPE_KEY = "custom";

// ─── Footer Options ─────────────────────────────────────────────────

export type FooterOptionValue = "closes" | "trailer" | "breaking-change" | "deprecated" | "custom";

export interface FooterOption {
  value: FooterOptionValue;
  label: string;
  hint: string;
}

export const COMMIT_FOOTER_OPTIONS: FooterOption[] = [
  { value: "closes",          label: "closes <issue/ticket>", hint: "Attempts to infer ticket from branch" },
  { value: "trailer",         label: "trailer",               hint: "Appends trailer based on commit type" },
  { value: "breaking-change", label: "breaking change",       hint: "Add breaking change" },
  { value: "deprecated",      label: "deprecated",            hint: "Add deprecated change" },
  { value: "custom",          label: "custom",                hint: "Add a custom footer" },
];

// ─── Config Shape ───────────────────────────────────────────────────

export interface BetterCommitsConfig {
  check_status: boolean;
  commit_type: {
    enable: boolean;
    initial_value: string;
    max_items: number;
    infer_type_from_branch: boolean;
    append_emoji_to_label: boolean;
    append_emoji_to_commit: boolean;
    emoji_commit_position: "Start" | "After-Colon";
    options: CommitTypeOption[];
  };
  commit_scope: {
    enable: boolean;
    custom_scope: boolean;
    max_items: number;
    initial_value: string;
    options: CommitScopeOption[];
  };
  check_ticket: {
    infer_ticket: boolean;
    confirm_ticket: boolean;
    add_to_title: boolean;
    append_hashtag: boolean;
    prepend_hashtag: "Never" | "Always" | "Prompt";
    surround: "" | "()" | "[]" | "{}";
    title_position: "start" | "end" | "before-colon" | "beginning";
  };
  commit_title: {
    max_size: number;
  };
  commit_body: {
    enable: boolean;
    required: boolean;
    split_by_period: boolean;
  };
  commit_footer: {
    enable: boolean;
    initial_value: FooterOptionValue[];
    options: FooterOptionValue[];
  };
  breaking_change: {
    add_exclamation_to_title: boolean;
  };
  confirm_commit: boolean;
  print_commit_output: boolean;
}

// ─── Commit State ───────────────────────────────────────────────────

export interface CommitState {
  type: string;
  scope: string;
  title: string;
  body: string;
  closes: string;
  ticket: string;
  breaking_title: string;
  breaking_body: string;
  deprecates_title: string;
  deprecates_body: string;
  custom_footer: string;
  trailer: string;
}

export function createEmptyCommitState(): CommitState {
  return {
    type: "",
    scope: "",
    title: "",
    body: "",
    closes: "",
    ticket: "",
    breaking_title: "",
    breaking_body: "",
    deprecates_title: "",
    deprecates_body: "",
    custom_footer: "",
    trailer: "",
  };
}

// ─── Default Config ─────────────────────────────────────────────────

export function getDefaultConfig(): BetterCommitsConfig {
  return {
    check_status: true,
    commit_type: {
      enable: true,
      initial_value: "feat",
      max_items: 20,
      infer_type_from_branch: true,
      append_emoji_to_label: false,
      append_emoji_to_commit: false,
      emoji_commit_position: "Start",
      options: DEFAULT_TYPE_OPTIONS,
    },
    commit_scope: {
      enable: true,
      custom_scope: false,
      max_items: 20,
      initial_value: "app",
      options: DEFAULT_SCOPE_OPTIONS,
    },
    check_ticket: {
      infer_ticket: true,
      confirm_ticket: true,
      add_to_title: true,
      append_hashtag: false,
      prepend_hashtag: "Never",
      surround: "",
      title_position: "start",
    },
    commit_title: {
      max_size: 70,
    },
    commit_body: {
      enable: true,
      required: false,
      split_by_period: false,
    },
    commit_footer: {
      enable: true,
      initial_value: [],
      options: ["closes", "trailer", "breaking-change", "deprecated", "custom"],
    },
    breaking_change: {
      add_exclamation_to_title: true,
    },
    confirm_commit: true,
    print_commit_output: true,
  };
}
