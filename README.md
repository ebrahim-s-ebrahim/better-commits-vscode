# Better Commits for VS Code

> A guided conventional commit message wizard — right inside VS Code's Source Control panel.

Inspired by the [better-commits](https://github.com/Everduin94/better-commits) CLI, this extension brings the same structured commit workflow into VS Code's native UI. No terminal needed — just Quick Picks, input boxes, and your SCM commit input.

![VS Code](https://img.shields.io/badge/VS%20Code-1.85%2B-blue?logo=visual-studio-code)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)

---

## ✨ Features

- **Guided wizard** — step-by-step Quick Pick flow for composing conventional commits
- **Branch-aware** — auto-infers commit type and ticket/issue from your branch name
- **SCM integration** — composed message goes straight into the Source Control input box
- **Config-compatible** — uses the same `.better-commits.json` format as the CLI
- **Fully configurable** — custom types, scopes, emoji, ticket formats, footers, and more
- **Multi-repo support** — works with VS Code multi-root workspaces

---

## 🚀 Quick Start

1. Install the extension
2. Open a Git repository in VS Code
3. Click the **✏️ icon** in the Source Control title bar (or run `Better Commits: Compose Commit Message` from the Command Palette)
4. Walk through the wizard
5. Your message appears in the commit input box — click **✓** to commit

---

## 📋 Wizard Flow

The wizard guides you through each part of a conventional commit:

| Step | Prompt | Details |
|------|--------|---------|
| 1 | **Commit type** | `feat`, `fix`, `docs`, `refactor`, etc. Auto-inferred from branch name |
| 2 | **Commit scope** | `app`, `auth`, `api`, or custom input |
| 3 | **Ticket / issue** | Auto-inferred from branch (e.g., `feat/PROJ-42` → `PROJ-42`) |
| 4 | **Title** | Brief description with live character count validation |
| 5 | **Body** | Detailed description (optional) |
| 6 | **Footers** | Breaking changes, deprecations, closes, trailers, custom |

### Example Output

Given branch `feat/PROJ-42_add-authentication`:

```
feat(auth): #PROJ-42 add OAuth2 login flow

Added Google and GitHub OAuth2 providers.
Includes token refresh logic.

Closes: #PROJ-42

Changelog: feature
```

---

## ⚙️ Configuration

The extension reads configuration from `.better-commits.json`, checked in this order:

1. **Workspace root** — `.better-commits.json` in your repo root (highest priority)
2. **Home directory** — `~/.better-commits.json` (global defaults)
3. **Built-in defaults** — sensible out-of-the-box values

Both files are deep-merged: repo config overrides global, global overrides defaults.

> **Tip:** If you already use the `better-commits` CLI, your existing config works as-is!

### Full Configuration Reference

<details>
<summary><strong>Click to expand full config reference</strong></summary>

```jsonc
{
  // ── Commit Type ──────────────────────────────────────────
  "commit_type": {
    "enable": true,                    // Show type selection step
    "initial_value": "feat",           // Pre-selected type
    "max_items": 20,                   // Max items in picker
    "infer_type_from_branch": true,    // Auto-detect from branch name
    "append_emoji_to_label": false,    // Show emoji in picker labels
    "append_emoji_to_commit": false,   // Include emoji in commit message
    "emoji_commit_position": "Start",  // "Start" or "After-Colon"
    "options": [
      {
        "value": "feat",
        "label": "feat",
        "hint": "A new feature",
        "emoji": "🌟",
        "trailer": "Changelog: feature"
      },
      {
        "value": "fix",
        "label": "fix",
        "hint": "A bug fix",
        "emoji": "🐛",
        "trailer": "Changelog: fix"
      }
      // ... add more types as needed
    ]
  },

  // ── Commit Scope ─────────────────────────────────────────
  "commit_scope": {
    "enable": true,                    // Show scope selection step
    "custom_scope": false,             // Allow freeform scope input
    "max_items": 20,                   // Max items in picker
    "initial_value": "app",            // Pre-selected scope
    "options": [
      { "value": "app",    "label": "app" },
      { "value": "shared", "label": "shared" },
      { "value": "server", "label": "server" },
      { "value": "tools",  "label": "tools" },
      { "value": "",       "label": "none" }
    ]
  },

  // ── Ticket / Issue ───────────────────────────────────────
  "check_ticket": {
    "infer_ticket": true,              // Auto-infer from branch name
    "confirm_ticket": true,            // Show confirmation/edit prompt
    "add_to_title": true,              // Include ticket in commit title
    "append_hashtag": false,           // Add # to inferred tickets
    "prepend_hashtag": "Never",        // "Never" | "Always" | "Prompt"
    "surround": "",                    // "" | "()" | "[]" | "{}"
    "title_position": "start"          // "start" | "end" | "before-colon" | "beginning"
  },

  // ── Commit Title ─────────────────────────────────────────
  "commit_title": {
    "max_size": 70                     // Max total title length
  },

  // ── Commit Body ──────────────────────────────────────────
  "commit_body": {
    "enable": true,                    // Show body input step
    "required": false,                 // Make body mandatory
    "split_by_period": false           // Auto-split sentences into lines
  },

  // ── Commit Footer ────────────────────────────────────────
  "commit_footer": {
    "enable": true,                    // Show footer selection step
    "initial_value": [],               // Pre-selected footers
    "options": [                       // Available footer types
      "closes",
      "trailer",
      "breaking-change",
      "deprecated",
      "custom"
    ]
  },

  // ── Breaking Change ──────────────────────────────────────
  "breaking_change": {
    "add_exclamation_to_title": true   // Add ! to type for breaking changes
  }
}
```

</details>

### Ticket Inference Patterns

The extension extracts ticket/issue identifiers from your branch name using these patterns:

| Branch Pattern | Extracted Ticket |
|---|---|
| `feat/PROJ-123` | `PROJ-123` |
| `PROJ-456-fix-bug` | `PROJ-456` |
| `feat/PROJ-789_description` | `PROJ-789` |
| `feat/42` | `42` |
| `123-fix-something` | `123` |

### Type Inference Patterns

| Branch Pattern | Inferred Type |
|---|---|
| `feat/add-login` | `feat` |
| `fix-crash-on-load` | `fix` |
| `user-chore-cleanup` | `chore` |

### Ticket Position Examples

| `title_position` | Result |
|---|---|
| `"start"` | `feat(auth): #PROJ-42 add login` |
| `"end"` | `feat(auth): add login #PROJ-42` |
| `"before-colon"` | `feat(auth) #PROJ-42: add login` |
| `"beginning"` | `#PROJ-42 feat(auth): add login` |

---

## 🔧 Extension Settings

| Setting | Default | Description |
|---|---|---|
| `betterCommits.configFile` | `.better-commits.json` | Config file name to search for in the workspace root |

---

## 📦 Commands

| Command | Description |
|---|---|
| `Better Commits: Compose Commit Message` | Launch the commit wizard |

Accessible via:
- **SCM title bar** — the ✏️ icon (visible when a Git repo is open)
- **Command Palette** — `Ctrl+Shift+P` → type "Better Commits"

---

## 🏗️ Architecture

```
src/
  extension.ts        → Activation, command registration, Git API integration
  commit-wizard.ts    → Multi-step Quick Pick wizard flow
  commit-builder.ts   → Commit message string construction
  config.ts           → .better-commits.json loading and merging
  git-helpers.ts      → Branch detection, type/ticket inference
  types.ts            → TypeScript interfaces and default values
```

The extension uses VS Code's built-in Git extension API to:
- Detect repositories in the workspace
- Read the current branch name
- Write the composed message to the SCM input box

---

## 🧪 Testing

```bash
# Unit tests (40 tests, no VS Code needed)
npm run test:unit

# Integration tests (launches VS Code Extension Host)
npm run test:integration

# E2E verification against sample repo
node dist/test/verify-e2e.js
```

See [TESTING.md](TESTING.md) for detailed instructions.

---

## 🤝 CLI Compatibility

This extension is designed to be a companion to the [better-commits CLI](https://github.com/Everduin94/better-commits). They share the same `.better-commits.json` config format, so teams can use either tool interchangeably:

- **CLI users** → run `better-commits` in the terminal
- **VS Code users** → click the ✏️ button in Source Control

One config file. Two interfaces. Same conventional commits.

---

## 📝 License

[MIT](LICENSE) — Based on [better-commits](https://github.com/Everduin94/better-commits) by Erik Verduin.
