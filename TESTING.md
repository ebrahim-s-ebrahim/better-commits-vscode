# Better Commits VS Code Extension — Local Testing Guide

## Prerequisites
- Node.js 18+ installed
- Git installed
- VS Code installed

## Quick Verification (no VS Code needed)

These commands verify the core logic works end-to-end against the sample repo.

```bash
# From the extension directory
cd D:\my-projects\better-commits-vscode

# Run unit tests (40 tests)
npm run test:unit

# Run E2E verification against sample repo
node dist/test/verify-e2e.js
```

The E2E script tests config loading, branch/ticket inference, and commit message
building against `D:\my-projects\better-commits-vscode-sample` — a sample git
repo on branch `feat/PROJ-42_add-authentication` with a `.better-commits.json`.

---

## Test in VS Code (Extension Development Host)

This is the real GUI test — it launches a second VS Code window with your extension loaded.

### Step 1: Open the extension project
```
code D:\my-projects\better-commits-vscode
```

### Step 2: Launch the Extension Development Host
1. Press **F5** (or Run → Start Debugging)
2. This opens a **new VS Code window** with your extension active

### Step 3: Open the sample repo in the dev host
In the **new window** that opened:
1. File → Open Folder → `D:\my-projects\better-commits-vscode-sample`
2. Open the **Source Control** tab (Ctrl+Shift+G)

### Step 4: Use the extension
You should see a **✏️ (edit) icon** in the Source Control title bar. Click it.

Alternatively, open Command Palette (Ctrl+Shift+P) and run:
```
Better Commits: Compose Commit Message
```

### Step 5: Walk through the wizard
The extension will guide you through:

1. **Select commit type** → `feat` should be pre-highlighted (inferred from branch `feat/PROJ-42_...`)
2. **Select commit scope** → pick `auth`, `api`, `ui`, `core`, `custom`, or `none`
3. **Ticket / Issue** → should auto-fill `PROJ-42` (inferred from branch)
4. **Commit title** → type something like `add OAuth2 login flow`
5. **Commit body** → optional description
6. **Footers** → select any combination of closes, trailer, breaking-change, etc.

After completing the wizard, the composed message appears in the **SCM commit input box**.
Click the **✓ checkmark** to commit as usual.

### Expected commit message format
```
feat(auth): #PROJ-42 add OAuth2 login flow
```

---

## Sample Repo Details

Located at: `D:\my-projects\better-commits-vscode-sample`

- **Branch:** `feat/PROJ-42_add-authentication`
- **Staged file:** `index.js`
- **Config:** `.better-commits.json` with custom types (feat, fix, docs, refactor, chore)
  and custom scopes (auth, api, ui, core) + custom scope input enabled

You can modify `.better-commits.json` in the sample repo to test different configurations.

---

## Useful npm Scripts

| Command                  | Description                                      |
|--------------------------|--------------------------------------------------|
| `npm run compile`        | Compile TypeScript to `dist/`                    |
| `npm run watch`          | Compile on save (useful during development)      |
| `npm run test:unit`      | Run 40 unit tests (Mocha, no VS Code needed)     |
| `npm run test:integration` | Run integration tests (downloads + launches VS Code) |
| `npm test`               | Alias for `test:unit`                            |
| `node dist/test/verify-e2e.js` | Run E2E verification against sample repo   |
