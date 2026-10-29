import assert from "node:assert/strict";
import test from "node:test";
import { parseModerationAction } from "../src/server/observations/moderation-action";

test("n'accepte que les trois actions de modération explicites", () => {
  assert.equal(parseModerationAction("verify"), "verify");
  assert.equal(parseModerationAction("remove"), "remove");
  assert.equal(parseModerationAction("restore"), "restore");
  assert.equal(parseModerationAction("unexpected"), null);
  assert.equal(parseModerationAction(null), null);
  assert.equal(parseModerationAction({ action: "restore" }), null);
});
