import * as assert from "assert";
import * as vscode from "vscode";

suite("Markdown Memo Templates", () => {
  test("Extension activates", async () => {
    const ext = vscode.extensions.getExtension("your-name.markdown-memo-templates");
    assert.ok(ext);
    await ext!.activate();
    assert.ok(ext!.isActive);
  });
});
