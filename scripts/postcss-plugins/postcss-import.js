const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

function resolveImportPath(params) {
  const match = params.match(/^["'](.+)["']$/);
  return match ? match[1] : null;
}

function inlineImports(root, fromFile) {
  root.walkAtRules("import", (atRule) => {
    const importPath = resolveImportPath(atRule.params.trim());

    if (!importPath) {
      return;
    }

    const absolutePath = path.resolve(path.dirname(fromFile), importPath);
    const css = fs.readFileSync(absolutePath, "utf8");
    const importedRoot = postcss.parse(css, { from: absolutePath });

    inlineImports(importedRoot, absolutePath);
    atRule.replaceWith(importedRoot.nodes);
  });
}

module.exports = () => ({
  postcssPlugin: "postcss-import-local",
  Once(root, { result }) {
    const fromFile = result.opts.from;
    if (!fromFile) {
      return;
    }

    inlineImports(root, fromFile);
  },
});

module.exports.postcss = true;
