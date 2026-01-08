import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

let outputChannel: vscode.OutputChannel | null = null;

interface MemoRule {
  pattern: string;
  path?: string;
  template?: string;
  templateFolder?: string;
  baseTemplate?: string;
  frontmatter?: Record<string, any>;
}


function logDebug(message: string) {
  const config = vscode.workspace.getConfiguration("memoTemplates");
  if (!config.get("debug")) return;

  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Markdown Memo Templates");
  }
  outputChannel.appendLine(message);
}

function makeSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function substituteVars(template: string, title: string, customVars: Record<string, string>) {
  const now = new Date();

  const builtIns: Record<string, string> = {
    "{{title}}": title,
    "{{slug}}": makeSlug(title),
    "{{date}}": now.toLocaleDateString(),
    "{{time}}": now.toLocaleTimeString(),
    "{{isoDate}}": now.toISOString(),
    "{{createdAt}}": now.toISOString(),
    "{{year}}": String(now.getFullYear()),
    "{{month}}": String(now.getMonth() + 1).padStart(2, "0"),
    "{{day}}": String(now.getDate()).padStart(2, "0")
  };

  const customMap = Object.fromEntries(
    Object.entries(customVars).map(([k, v]) => [`{{${k}}}`, v])
  );

  const vars = { ...builtIns, ...customMap };

  let output = template;
  for (const [key, value] of Object.entries(vars)) {
    output = output.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), value);
  }

  return output;
}

function objectToYaml(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");
}

function loadTemplateFile(
  context: vscode.ExtensionContext,
  templateFolder: string,
  templateFileName: string
): string {
  const candidate = path.join(templateFolder, templateFileName);
  if (fs.existsSync(candidate)) return fs.readFileSync(candidate, "utf8");

  const fallback = path.join(context.extensionPath, "templates", templateFileName);
  if (fs.existsSync(fallback)) return fs.readFileSync(fallback, "utf8");

  return "";
}

function activate(context: vscode.ExtensionContext) {
  const memoExt = vscode.extensions.getExtension("svsool.markdown-memo");
  if (!memoExt) return;

  memoExt.activate().then(api => {
    // ✅ 1. Register your template provider (REQUIRED)
    if (api.registerTemplateProvider) {
      api.registerTemplateProvider("memoTemplates", {
        provideTemplate: () => {} // You can leave this empty; you only use onDidCreateNote
      });
    }

    // 🔍 2. Debug: confirm your settings load correctly
    const config = vscode.workspace.getConfiguration("memoTemplates");
    const rules = config.get<MemoRule[]>("rules", []);
    console.log("Loaded memoTemplates.rules:", rules);

    api.onDidCreateNote(async (note: any) => {
      const config = vscode.workspace.getConfiguration("memoTemplates");
      const rules = config.get<MemoRule[]>("rules", []);
      const globalTemplateFolder = config.get<string>("templateFolder", "templates");
      const customVars = config.get<Record<string, string>>("customVariables", {});

      const fileName = note.title;
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspaceFolder) return;

      const rule = rules.find((r: MemoRule) => 
        new RegExp(r.pattern).test(fileName)
      );
      const targetDir = rule?.path
        ? path.join(workspaceFolder, rule.path as string)
        : workspaceFolder;
      const targetPath = path.join(targetDir, fileName + ".md");

      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      if (!fs.existsSync(targetPath)) {
        const templateFolder =
          rule?.templateFolder || path.join(workspaceFolder, globalTemplateFolder);

        const base = rule?.baseTemplate
          ? loadTemplateFile(context, templateFolder, rule.baseTemplate)
          : "";

        const child = rule?.template
          ? loadTemplateFile(context, templateFolder, rule.template)
          : "";

        const merged = base
          ? base.replace(/{{\s*content\s*}}/g, child)
          : child;

        const frontmatter = {
          title: fileName,
          slug: makeSlug(fileName),
          createdAt: new Date().toISOString(),
          ...customVars,
          ...(rule?.frontmatter || {})
        };

        const finalContent =
          `---\n${objectToYaml(frontmatter)}\n---\n\n` +
          substituteVars(merged, fileName, customVars);

        fs.writeFileSync(targetPath, finalContent);
      }
    });
  });
  context.subscriptions.push(
    vscode.commands.registerCommand("memoTemplates.previewVariables", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Enter a note title" });
      if (!title) return;

      const config = vscode.workspace.getConfiguration("memoTemplates");
      const customVars = config.get<Record<string, string>>("customVariables", {});

      const preview = substituteVars(
        "title: {{title}}\nslug: {{slug}}\ncreatedAt: {{createdAt}}",
        title,
        customVars
      );

      vscode.window.showInformationMessage(preview, { modal: true });
    })
  );
}

function deactivate() {}

export { activate, deactivate };
