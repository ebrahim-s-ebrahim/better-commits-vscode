import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { execSync } from "child_process";
import {
  getCurrentBranch,
  inferTypeFromBranch,
  inferTicketFromBranch,
} from "../../git-helpers";

suite("git-helpers", () => {
  let tempRepo: string;

  setup(() => {
    tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), "bc-git-test-"));
    execSync("git init", { cwd: tempRepo, stdio: "pipe" });
    execSync("git commit --allow-empty -m init", {
      cwd: tempRepo,
      stdio: "pipe",
    });
  });

  teardown(() => {
    fs.rmSync(tempRepo, { recursive: true, force: true });
  });

  suite("getCurrentBranch", () => {
    test("returns branch name for a valid repo", () => {
      const branch = getCurrentBranch(tempRepo);
      // Default branch is typically 'main' or 'master'
      assert.ok(
        branch === "main" || branch === "master",
        `Expected main or master, got: ${branch}`
      );
    });

    test("returns empty string for non-repo directory", () => {
      const nonRepo = fs.mkdtempSync(path.join(os.tmpdir(), "bc-no-git-"));
      try {
        const branch = getCurrentBranch(nonRepo);
        assert.strictEqual(branch, "");
      } finally {
        fs.rmSync(nonRepo, { recursive: true, force: true });
      }
    });
  });

  suite("inferTypeFromBranch", () => {
    test("infers type from branch with slash pattern (feat/...)", () => {
      execSync("git checkout -b feat/add-login", {
        cwd: tempRepo,
        stdio: "pipe",
      });
      const types = ["feat", "fix", "chore", "docs"];
      const result = inferTypeFromBranch(types, tempRepo);
      assert.strictEqual(result, "feat");
    });

    test("infers type from branch with dash prefix (fix-...)", () => {
      execSync("git checkout -b fix-crash-on-load", {
        cwd: tempRepo,
        stdio: "pipe",
      });
      const types = ["feat", "fix", "chore"];
      const result = inferTypeFromBranch(types, tempRepo);
      assert.strictEqual(result, "fix");
    });

    test("infers type from branch with dash-surrounded pattern (...-chore-...)", () => {
      execSync("git checkout -b user-chore-cleanup", {
        cwd: tempRepo,
        stdio: "pipe",
      });
      const types = ["feat", "fix", "chore"];
      const result = inferTypeFromBranch(types, tempRepo);
      assert.strictEqual(result, "chore");
    });

    test("returns empty string when no type matches", () => {
      execSync("git checkout -b my-awesome-branch", {
        cwd: tempRepo,
        stdio: "pipe",
      });
      const types = ["feat", "fix", "chore"];
      const result = inferTypeFromBranch(types, tempRepo);
      assert.strictEqual(result, "");
    });

    test("skips empty type values", () => {
      execSync("git checkout -b feat/something", {
        cwd: tempRepo,
        stdio: "pipe",
      });
      const types = ["", "feat", "fix"];
      const result = inferTypeFromBranch(types, tempRepo);
      assert.strictEqual(result, "feat");
    });
  });

  suite("inferTicketFromBranch", () => {
    test("extracts ticket from slash pattern (feat/PROJ-123)", () => {
      execSync("git checkout -b feat/PROJ-123", {
        cwd: tempRepo,
        stdio: "pipe",
      });
      const ticket = inferTicketFromBranch(tempRepo);
      assert.strictEqual(ticket, "PROJ-123");
    });

    test("extracts ticket from start pattern (PROJ-123-description)", () => {
      execSync("git checkout -b PROJ-456-fix-bug", {
        cwd: tempRepo,
        stdio: "pipe",
      });
      const ticket = inferTicketFromBranch(tempRepo);
      assert.strictEqual(ticket, "PROJ-456");
    });

    test("extracts numeric ticket from slash (feat/42)", () => {
      execSync("git checkout -b feat/42", { cwd: tempRepo, stdio: "pipe" });
      const ticket = inferTicketFromBranch(tempRepo);
      assert.strictEqual(ticket, "42");
    });

    test("extracts numeric ticket from start (123-fix)", () => {
      execSync("git checkout -b 123-fix-something", {
        cwd: tempRepo,
        stdio: "pipe",
      });
      const ticket = inferTicketFromBranch(tempRepo);
      assert.strictEqual(ticket, "123");
    });

    test("returns empty string when no ticket pattern found", () => {
      execSync("git checkout -b some-random-branch", {
        cwd: tempRepo,
        stdio: "pipe",
      });
      const ticket = inferTicketFromBranch(tempRepo);
      assert.strictEqual(ticket, "");
    });

    test("extracts ticket from underscore pattern (PROJ-123_description)", () => {
      execSync("git checkout -b PROJ-789_add-feature", {
        cwd: tempRepo,
        stdio: "pipe",
      });
      const ticket = inferTicketFromBranch(tempRepo);
      assert.strictEqual(ticket, "PROJ-789");
    });
  });
});
