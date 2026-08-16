const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');
const partialsRoot = path.join(projectRoot, 'partials');

const rootFilesToCopy = [
  '404.html',
  'contact.html',
  'cookies.html',
  'fleet.html',
  'index.html',
  'offline.html',
  'pricing.html',
  'privacy.html',
  'robots.txt',
  'service.html',
  'services.html',
  'sitemap.xml',
  'sw.js',
  'terms.html',
  '_headers',
  '_redirects',
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyPath(relativePath) {
  const sourcePath = path.join(projectRoot, relativePath);
  const destinationPath = path.join(distRoot, relativePath);

  const sourceStat = fs.statSync(sourcePath);

  if (sourceStat.isDirectory()) {
    fs.cpSync(sourcePath, destinationPath, { recursive: true });
    return;
  }

  ensureDir(path.dirname(destinationPath));
  fs.copyFileSync(sourcePath, destinationPath);
}

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');

  for (const [searchValue, replaceValue] of replacements) {
    content = content.replaceAll(searchValue, replaceValue);
  }

  fs.writeFileSync(filePath, content);
}

function inlineHtmlPartials(htmlPath) {
  const header = fs.readFileSync(path.join(partialsRoot, 'header.html'), 'utf8').trimEnd();
  const footer = fs.readFileSync(path.join(partialsRoot, 'footer.html'), 'utf8').trimEnd();

  replaceInFile(htmlPath, [
    ['{{> header}}', header],
    ['{{> footer}}', footer],
    ['<div data-partial="header"></div>', header],
    ['<div data-partial="footer"></div>', footer],
  ]);
}

function rewriteDistHtmlReferences() {
  for (const rootFile of rootFilesToCopy) {
    if (!rootFile.endsWith('.html')) continue;

    const htmlPath = path.join(distRoot, rootFile);

    inlineHtmlPartials(htmlPath);

    replaceInFile(htmlPath, [
      ['/assets/css/style.css', '/assets/css/style.min.css'],
      ['assets/css/style.css', 'assets/css/style.min.css'],
      ['/assets/js/main.js', '/assets/js/main.min.js'],
      ['assets/js/main.js', 'assets/js/main.min.js'],
    ]);
  }
}

function rewriteDistServiceWorkerReferences() {
  const swPath = path.join(distRoot, 'sw.js');
  replaceInFile(swPath, [['/assets/js/main.js', '/assets/js/main.min.js']]);
}

function buildDist() {
  fs.rmSync(distRoot, { recursive: true, force: true });
  ensureDir(distRoot);

  for (const rootFile of rootFilesToCopy) {
    copyPath(rootFile);
  }

  copyPath('assets');

  rewriteDistHtmlReferences();
  rewriteDistServiceWorkerReferences();

  console.log(`Built dist package: ${path.relative(projectRoot, distRoot)}`);
}

buildDist();
