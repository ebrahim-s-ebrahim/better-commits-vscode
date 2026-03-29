import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { loadConfig } from "../../config";
import { getDefaultConfig } from "../../types";

suite("config", () => {
  let tempDir: string;

  setup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bc-test-"));
  });

  teardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("returns default config when no config file exists", () => {
    const config = loadConfig(tempDir);
    const defaults = getDefaultConfig();

    assert.strictEqual(config.commit_type.enable, defaults.commit_type.enable);
    assert.strictEqual(
      config.commit_type.initial_value,
      defaults.commit_type.initial_value
    );
    assert.strictEqual(
      config.commit_scope.enable,
      defaults.commit_scope.enable
    );
    assert.strictEqual(
      config.commit_body.enable,
      defaults.commit_body.enable
    );
  });

  test("loads repo config and overrides defaults", () => {
    const repoConfig = {
      commit_type: {
        initial_value: "fix",
        append_emoji_to_label: true,
      },
      commit_title: {
        max_size: 100,
      },
    };
    fs.writeFileSync(
      path.join(tempDir, ".better-commits.json"),
      JSON.stringify(repoConfig)
    );

    const config = loadConfig(tempDir);

    assert.strictEqual(config.commit_type.initial_value, "fix");
    assert.strictEqual(config.commit_type.append_emoji_to_label, true);
    assert.strictEqual(config.commit_title.max_size, 100);
    // Non-overridden values stay default
    assert.strictEqual(config.commit_type.enable, true);
    assert.strictEqual(config.commit_scope.enable, true);
  });

  test("handles partial config gracefully", () => {
    const partialConfig = {
      commit_body: {
        required: true,
      },
    };
    fs.writeFileSync(
      path.join(tempDir, ".better-commits.json"),
      JSON.stringify(partialConfig)
    );

    const config = loadConfig(tempDir);

    assert.strictEqual(config.commit_body.required, true);
    assert.strictEqual(config.commit_body.enable, true); // default preserved
    assert.strictEqual(config.commit_body.split_by_period, false); // default preserved
  });

  test("handles empty config object", () => {
    fs.writeFileSync(
      path.join(tempDir, ".better-commits.json"),
      JSON.stringify({})
    );

    const config = loadConfig(tempDir);
    const defaults = getDefaultConfig();

    assert.strictEqual(config.commit_type.enable, defaults.commit_type.enable);
  });

  test("overrides array values completely (commit type options)", () => {
    const customTypes = {
      commit_type: {
        options: [
          { value: "feature", label: "feature", hint: "A new feature" },
          { value: "bugfix", label: "bugfix", hint: "A bug fix" },
        ],
      },
    };
    fs.writeFileSync(
      path.join(tempDir, ".better-commits.json"),
      JSON.stringify(customTypes)
    );

    const config = loadConfig(tempDir);

    assert.strictEqual(config.commit_type.options.length, 2);
    assert.strictEqual(config.commit_type.options[0].value, "feature");
    assert.strictEqual(config.commit_type.options[1].value, "bugfix");
  });

  test("returns defaults when workspace root is undefined", () => {
    const config = loadConfig(undefined);
    const defaults = getDefaultConfig();

    assert.strictEqual(config.commit_type.enable, defaults.commit_type.enable);
  });
});
