import * as vscode from "vscode";
import { runCommitWizard } from "./commit-wizard";
import { setWarnHandler } from "./config";

// Type for the built-in Git extension API
interface GitExtension {
  getAPI(version: 1): GitAPI;
}

interface GitAPI {
  repositories: Repository[];
}

interface Repository {
  rootUri: vscode.Uri;
  inputBox: { value: string };
}

export function activate(context: vscode.ExtensionContext) {
  // Route config warnings through VS Code notifications
  setWarnHandler((msg) => vscode.window.showWarningMessage(msg));
  const disposable = vscode.commands.registerCommand(
    "betterCommits.commit",
    async () => {
      // Get the built-in Git extension
      const gitExtension =
        vscode.extensions.getExtension<GitExtension>("vscode.git");

      if (!gitExtension) {
        vscode.window.showErrorMessage(
          "Better Commits: Git extension not found. Please install the built-in Git extension."
        );
        return;
      }

      const git = gitExtension.isActive
        ? gitExtension.exports.getAPI(1)
        : (await gitExtension.activate()).getAPI(1);

      if (!git.repositories.length) {
        vscode.window.showErrorMessage(
          "Better Commits: No Git repositories found in this workspace."
        );
        return;
      }

      // If multiple repos, let the user pick
      let repo: Repository;
      if (git.repositories.length === 1) {
        repo = git.repositories[0];
      } else {
        const repoItems = git.repositories.map((r) => ({
          label: r.rootUri.fsPath,
          repo: r,
        }));
        const picked = await vscode.window.showQuickPick(repoItems, {
          title: "Better Commits: Select repository",
          placeHolder: "Which repository do you want to commit to?",
        });
        if (!picked) { return; }
        repo = picked.repo;
      }

      const repoPath = repo.rootUri.fsPath;

      // Run the commit wizard
      const commitMessage = await runCommitWizard(repoPath);

      if (commitMessage) {
        // Populate the SCM input box with the composed message
        repo.inputBox.value = commitMessage;
        vscode.window.showInformationMessage(
          "Better Commits: Message composed! Review and click ✓ to commit."
        );

        // Focus the Source Control view so the user can see the message
        await vscode.commands.executeCommand("workbench.view.scm");
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
