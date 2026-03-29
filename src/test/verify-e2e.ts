/**
 * End-to-end verification script.
 * Exercises all core logic against the sample repo to prove things work
 * without needing a VS Code GUI.
 *
 * Run: node dist/test/verify-e2e.js
 */
import { loadConfig } from "../config";
import { getCurrentBranch, inferTypeFromBranch, inferTicketFromBranch } from "../git-helpers";
import { buildCommitString, cleanCommitTitle } from "../commit-builder";
import { createEmptyCommitState } from "../types";

const SAMPLE_REPO = "D:\\my-projects\\better-commits-vscode-sample";

function header(label: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${"─".repeat(60)}`);
}

function check(label: string, actual: string, expected: string) {
  const pass = actual === expected;
  const icon = pass ? "✅" : "❌";
  console.log(`${icon}  ${label}`);
  if (!pass) {
    console.log(`     Expected: "${expected}"`);
    console.log(`     Actual:   "${actual}"`);
    process.exitCode = 1;
  }
}

// ── 1. Config Loading ──────────────────────────────────────────────
header("1. Config Loading");
const config = loadConfig(SAMPLE_REPO);
console.log(`   commit_type.enable:           ${config.commit_type.enable}`);
console.log(`   commit_type.options count:     ${config.commit_type.options.length}`);
console.log(`   commit_scope.custom_scope:     ${config.commit_scope.custom_scope}`);
console.log(`   check_ticket.prepend_hashtag:  ${config.check_ticket.prepend_hashtag}`);
console.log(`   commit_title.max_size:         ${config.commit_title.max_size}`);
check("Config loaded with custom types", String(config.commit_type.options.length), "6");
check("Custom scope enabled", String(config.commit_scope.custom_scope), "true");
check("Hashtag set to Always", config.check_ticket.prepend_hashtag, "Always");

// ── 2. Git Helpers ─────────────────────────────────────────────────
header("2. Git Helpers — Branch Detection");
const branch = getCurrentBranch(SAMPLE_REPO);
console.log(`   Current branch: ${branch}`);
check("Branch detected", branch, "feat/PROJ-42_add-authentication");

header("3. Git Helpers — Type Inference");
const typeValues = config.commit_type.options.map(o => o.value);
const inferredType = inferTypeFromBranch(typeValues, SAMPLE_REPO);
console.log(`   Inferred type: ${inferredType}`);
check("Type inferred from branch", inferredType, "feat");

header("4. Git Helpers — Ticket Inference");
const inferredTicket = inferTicketFromBranch(SAMPLE_REPO);
console.log(`   Inferred ticket: ${inferredTicket}`);
check("Ticket inferred from branch", inferredTicket, "PROJ-42");

// ── 3. Commit Builder ──────────────────────────────────────────────
header("5. Commit Builder — Simple Commit");
const state1 = createEmptyCommitState();
state1.type = "feat";
state1.scope = "auth";
state1.title = "add OAuth2 login";
state1.ticket = "#PROJ-42";
const msg1 = buildCommitString(state1, config);
console.log(`   Message: ${msg1}`);
check("Simple commit message", msg1, "feat(auth): #PROJ-42 add OAuth2 login");

header("6. Commit Builder — Full Commit with Body + Footer");
const state2 = createEmptyCommitState();
state2.type = "feat";
state2.scope = "auth";
state2.title = "add OAuth2 login";
state2.ticket = "#PROJ-42";
state2.body = "Added Google and GitHub OAuth2 providers.\nIncludes token refresh logic.";
state2.closes = "Closes:";
state2.trailer = "Changelog: feature";
const msg2 = buildCommitString(state2, config);
console.log(`   Message:\n${msg2.split("\n").map(l => "   │ " + l).join("\n")}`);
check("Has type+scope", msg2.startsWith("feat(auth):") ? "yes" : "no", "yes");
check("Has ticket", msg2.includes("#PROJ-42") ? "yes" : "no", "yes");
check("Has body", msg2.includes("Google and GitHub") ? "yes" : "no", "yes");
check("Has closes footer", msg2.includes("Closes: #PROJ-42") ? "yes" : "no", "yes");
check("Has trailer", msg2.includes("Changelog: feature") ? "yes" : "no", "yes");

header("7. Commit Builder — Breaking Change");
const state3 = createEmptyCommitState();
state3.type = "feat";
state3.scope = "auth";
state3.title = "replace session auth";
state3.ticket = "#PROJ-42";
state3.breaking_title = "removed cookie-based sessions";
state3.breaking_body = "Migrate to JWT tokens. See docs/migration.md.";
const msg3 = buildCommitString(state3, config);
console.log(`   Message:\n${msg3.split("\n").map(l => "   │ " + l).join("\n")}`);
check("Has exclamation", msg3.includes("!:") ? "yes" : "no", "yes");
check("Has BREAKING CHANGE", msg3.includes("BREAKING CHANGE: removed cookie-based sessions") ? "yes" : "no", "yes");
check("Has migration body", msg3.includes("Migrate to JWT") ? "yes" : "no", "yes");

header("8. Clean Title");
check("Trailing period removed", cleanCommitTitle("add feature."), "add feature");
check("Whitespace trimmed", cleanCommitTitle("  fix bug  "), "fix bug");

// ── Summary ────────────────────────────────────────────────────────
header("SUMMARY");
if (process.exitCode === 1) {
  console.log("❌  Some checks failed. See above.");
} else {
  console.log("✅  All checks passed! Core logic is working correctly.");
}
console.log("");
