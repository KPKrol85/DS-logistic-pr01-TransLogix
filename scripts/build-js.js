const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const entryFile = path.join(projectRoot, 'assets/js/main.js');
const outputFile = path.join(projectRoot, 'assets/js/main.min.js');

function minifyJs(source) {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutLineComments = withoutBlockComments.replace(/^\s*\/\/.*$/gm, '');

  return withoutLineComments
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function buildJs() {
  const source = fs.readFileSync(entryFile, 'utf8');
  const minified = minifyJs(source);

  fs.writeFileSync(outputFile, `${minified}\n`);

  const relativeOut = path.relative(projectRoot, outputFile);
  console.log(`Built JS: ${relativeOut}`);
}

buildJs();
