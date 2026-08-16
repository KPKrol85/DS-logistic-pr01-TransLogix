const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const cssnano = require('cssnano');

const projectRoot = path.resolve(__dirname, '..');
const entryFile = path.join(projectRoot, 'assets/css/style.css');
const outputFile = path.join(projectRoot, 'assets/css/style.min.css');

function inlineImports(filePath, seen = new Set()) {
  const resolved = path.resolve(filePath);

  if (seen.has(resolved)) {
    throw new Error(`Circular @import detected: ${resolved}`);
  }

  seen.add(resolved);

  const content = fs.readFileSync(resolved, 'utf8');
  const dir = path.dirname(resolved);
  const lines = content.split(/\r?\n/);
  const inlined = [];

  for (const line of lines) {
    const match = line.match(/^\s*@import\s+["'](.+?)["'];\s*$/);
    if (!match) {
      inlined.push(line);
      continue;
    }

    const importPath = path.resolve(dir, match[1]);
    inlined.push(inlineImports(importPath, new Set(seen)));
  }

  return inlined.join('\n');
}

async function buildCss() {
  const bundledCss = inlineImports(entryFile);
  const result = await postcss([
    cssnano({
      preset: 'default',
    }),
  ]).process(bundledCss, { from: entryFile, to: outputFile });

  fs.writeFileSync(outputFile, result.css);
  console.log(`Built CSS: ${path.relative(projectRoot, outputFile)}`);
}

buildCss().catch((error) => {
  console.error(error);
  process.exit(1);
});
