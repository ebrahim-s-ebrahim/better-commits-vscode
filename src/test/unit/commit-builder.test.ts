import * as assert from "assert";
import { buildCommitString, cleanCommitTitle } from "../../commit-builder";
import { createEmptyCommitState, getDefaultConfig } from "../../types";

suite("commit-builder", () => {
  suite("cleanCommitTitle", () => {
    test("trims whitespace", () => {
      assert.strictEqual(cleanCommitTitle("  hello  "), "hello");
    });

    test("removes trailing period", () => {
      assert.strictEqual(cleanCommitTitle("add feature."), "add feature");
    });

    test("leaves title without trailing period unchanged", () => {
      assert.strictEqual(cleanCommitTitle("add feature"), "add feature");
    });

    test("handles empty string", () => {
      assert.strictEqual(cleanCommitTitle(""), "");
    });

    test("removes trailing period and trims", () => {
      assert.strictEqual(cleanCommitTitle("  fix bug.  "), "fix bug");
    });
  });

  suite("buildCommitString", () => {
    const config = getDefaultConfig();

    test("builds simple type + title", () => {
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "add login page";

      const result = buildCommitString(state, config);
      assert.strictEqual(result, "feat: add login page");
    });

    test("builds type + scope + title", () => {
      const state = createEmptyCommitState();
      state.type = "fix";
      state.scope = "auth";
      state.title = "resolve token refresh";

      const result = buildCommitString(state, config);
      assert.strictEqual(result, "fix(auth): resolve token refresh");
    });

    test("includes body separated by blank line", () => {
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "add dark mode";
      state.body = "Implemented dark mode toggle.";

      const result = buildCommitString(state, config);
      assert.strictEqual(
        result,
        "feat: add dark mode\n\nImplemented dark mode toggle."
      );
    });

    test("includes breaking change footer", () => {
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "new auth system";
      state.breaking_title = "removed legacy auth";

      const result = buildCommitString(state, config);
      assert.ok(result.includes("BREAKING CHANGE: removed legacy auth"));
    });

    test("adds exclamation mark for breaking change", () => {
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "new auth system";
      state.breaking_title = "removed legacy auth";

      const result = buildCommitString(state, config);
      assert.ok(result.startsWith("feat!: "));
    });

    test("does not add exclamation when config disables it", () => {
      const noExclamConfig = {
        ...config,
        breaking_change: { add_exclamation_to_title: false },
      };
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "new auth";
      state.breaking_title = "removed legacy";

      const result = buildCommitString(state, noExclamConfig);
      assert.ok(result.startsWith("feat: "));
    });

    test("includes deprecated footer", () => {
      const state = createEmptyCommitState();
      state.type = "chore";
      state.title = "deprecate old API";
      state.deprecates_title = "v1 API endpoints";

      const result = buildCommitString(state, config);
      assert.ok(result.includes("DEPRECATED: v1 API endpoints"));
    });

    test("includes closes footer with ticket", () => {
      const state = createEmptyCommitState();
      state.type = "fix";
      state.title = "resolve crash";
      state.ticket = "#42";
      state.closes = "Closes:";

      const result = buildCommitString(state, config);
      assert.ok(result.includes("Closes: #42"));
    });

    test("includes custom footer", () => {
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "add feature";
      state.custom_footer = "Reviewed-by: Alice";

      const result = buildCommitString(state, config);
      assert.ok(result.includes("Reviewed-by: Alice"));
    });

    test("includes trailer", () => {
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "add feature";
      state.trailer = "Changelog: feature";

      const result = buildCommitString(state, config);
      assert.ok(result.includes("Changelog: feature"));
    });

    test("ticket at start position (default)", () => {
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "add login";
      state.ticket = "#123";

      const result = buildCommitString(state, config);
      assert.strictEqual(result, "feat: #123 add login");
    });

    test("ticket at end position", () => {
      const endConfig = {
        ...config,
        check_ticket: {
          ...config.check_ticket,
          title_position: "end" as const,
        },
      };
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "add login";
      state.ticket = "#123";

      const result = buildCommitString(state, endConfig);
      assert.strictEqual(result, "feat: add login #123");
    });

    test("ticket at beginning position", () => {
      const beginConfig = {
        ...config,
        check_ticket: {
          ...config.check_ticket,
          title_position: "beginning" as const,
        },
      };
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "add login";
      state.ticket = "PROJ-99";

      const result = buildCommitString(state, beginConfig);
      assert.strictEqual(result, "PROJ-99 feat: add login");
    });

    test("ticket with surround brackets", () => {
      const surroundConfig = {
        ...config,
        check_ticket: {
          ...config.check_ticket,
          surround: "()" as const,
        },
      };
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "add login";
      state.ticket = "#123";

      const result = buildCommitString(state, surroundConfig);
      assert.strictEqual(result, "feat: (#123) add login");
    });

    test("ticket not added when add_to_title is false", () => {
      const noTicketConfig = {
        ...config,
        check_ticket: {
          ...config.check_ticket,
          add_to_title: false,
        },
      };
      const state = createEmptyCommitState();
      state.type = "feat";
      state.title = "add login";
      state.ticket = "#123";

      const result = buildCommitString(state, noTicketConfig);
      assert.strictEqual(result, "feat: add login");
    });

    test("full conventional commit with all fields", () => {
      const state = createEmptyCommitState();
      state.type = "feat";
      state.scope = "auth";
      state.title = "add OAuth2";
      state.body = "Added Google and GitHub providers.";
      state.breaking_title = "removed basic auth";
      state.breaking_body = "Migrate to OAuth2 flow.";
      state.trailer = "Changelog: feature";

      const result = buildCommitString(state, config);
      assert.ok(result.startsWith("feat(auth)!: "));
      assert.ok(result.includes("add OAuth2"));
      assert.ok(result.includes("Added Google and GitHub providers."));
      assert.ok(result.includes("BREAKING CHANGE: removed basic auth"));
      assert.ok(result.includes("Migrate to OAuth2 flow."));
      assert.ok(result.includes("Changelog: feature"));
    });
  });
});
