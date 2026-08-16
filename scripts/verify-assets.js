const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const ignoredPrefixes = ['http://', 'https://', 'data:', 'mailto:', '#'];
const ignoredDirectories = new Set([
  '.git',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
]);
const projectOwnedHtmlDirectories = [
  path.join(projectRoot, 'partials'),
  path.join(projectRoot, 'templates'),
];

function isIgnoredDirectory(entryName) {
  return ignoredDirectories.has(entryName);
}

function getRootHtmlFiles() {
  return fs
    .readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => path.join(projectRoot, entry.name));
}

function getProjectHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!isIgnoredDirectory(entry.name)) {
        files.push(...getProjectHtmlFiles(fullPath));
      }
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

function getVerifiableHtmlFiles() {
  return [
    ...getRootHtmlFiles(),
    ...projectOwnedHtmlDirectories.flatMap((dir) => getProjectHtmlFiles(dir)),
  ];
}

function shouldIgnoreAsset(assetPath) {
  return ignoredPrefixes.some((prefix) => assetPath.startsWith(prefix));
}

function normalizeAssetPath(rawPath) {
  if (!rawPath) return null;

  const trimmed = rawPath.trim();
  if (!trimmed || shouldIgnoreAsset(trimmed)) return null;

  const withoutHash = trimmed.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];

  if (!withoutQuery || shouldIgnoreAsset(withoutQuery)) return null;

  return withoutQuery;
}

function resolveFromRoot(assetPath) {
  if (assetPath === '/') {
    return path.join(projectRoot, 'index.html');
  }

  const withoutLeadingSlash = assetPath.replace(/^\/+/, '');
  return path.join(projectRoot, withoutLeadingSlash);
}

function extractHtmlAssets(htmlContent) {
  const assets = [];
  const patterns = [
    /<link\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi,
    /<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi,
    /<img\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi,
    /<source\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(htmlContent)) !== null) {
      if (match[2]) assets.push(match[2]);
    }
  }

  return assets;
}

function extractPrecacheAssets(swContent) {
  const precacheMatch = swContent.match(/const\s+PRECACHE_URLS\s*=\s*\[([\s\S]*?)\];/);
  if (!precacheMatch) return [];

  const arrayBody = precacheMatch[1];
  const assets = [];
  const stringRegex = /(["'`])((?:\\.|(?!\1).)*)\1/g;

  let match;
  while ((match = stringRegex.exec(arrayBody)) !== null) {
    assets.push(match[2]);
  }

  return assets;
}

function verifyAssets() {
  const missingAssets = new Set();
  const referencedAssets = new Set();

  const htmlFiles = getVerifiableHtmlFiles();

  for (const htmlFile of htmlFiles) {
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const htmlAssets = extractHtmlAssets(htmlContent);

    for (const rawAsset of htmlAssets) {
      const normalized = normalizeAssetPath(rawAsset);
      if (!normalized) continue;

      referencedAssets.add(normalized);
    }
  }

  const swPath = path.join(projectRoot, 'sw.js');
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    const swAssets = extractPrecacheAssets(swContent);

    for (const rawAsset of swAssets) {
      const normalized = normalizeAssetPath(rawAsset);
      if (!normalized) continue;

      referencedAssets.add(normalized);
    }
  }

  for (const assetPath of referencedAssets) {
    const resolvedPath = resolveFromRoot(assetPath);
    if (!fs.existsSync(resolvedPath)) {
      missingAssets.add(assetPath);
    }
  }

  if (missingAssets.size > 0) {
    console.error('Missing assets:');
    for (const asset of [...missingAssets].sort()) {
      console.error(`- ${asset}`);
    }
    process.exit(1);
  }

  console.log('All referenced assets exist.');
  process.exit(0);
}

verifyAssets();
