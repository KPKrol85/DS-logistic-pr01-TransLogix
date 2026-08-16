const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

function getProjectHtmlFiles() {
  return fs
    .readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => path.join(projectRoot, entry.name));
}

function isIgnoredReference(reference) {
  if (!reference) return true;

  const trimmed = reference.trim();
  if (!trimmed) return true;

  if (trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('//')) return true;

  return /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed);
}

function normalizeReference(reference) {
  const withoutHash = reference.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  return withoutQuery.trim();
}

function buildCandidatePaths(sourceHtmlFile, normalizedReference) {
  const candidates = [];

  const basePath = normalizedReference.startsWith('/')
    ? path.join(projectRoot, normalizedReference.replace(/^\/+/, ''))
    : path.resolve(path.dirname(sourceHtmlFile), normalizedReference);

  candidates.push(basePath);

  if (normalizedReference.endsWith('/')) {
    candidates.push(path.join(basePath, 'index.html'));
  }

  if (!path.extname(basePath)) {
    candidates.push(`${basePath}.html`);
  }

  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    candidates.push(path.join(basePath, 'index.html'));
  }

  return [...new Set(candidates)];
}

function extractLocalReferences(htmlContent) {
  const references = [];
  const attrRegex = /\b(href|src)\s*=\s*(["'])(.*?)\2/gi;

  let match;
  while ((match = attrRegex.exec(htmlContent)) !== null) {
    const attrName = match[1];
    const rawValue = match[3];

    if (isIgnoredReference(rawValue)) {
      continue;
    }

    const normalized = normalizeReference(rawValue);
    if (!normalized || isIgnoredReference(normalized)) {
      continue;
    }

    references.push({ attrName, rawValue, normalized });
  }

  return references;
}

function validateLocalLinks() {
  const htmlFiles = getProjectHtmlFiles();
  const missingReferences = [];

  for (const htmlFile of htmlFiles) {
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const references = extractLocalReferences(htmlContent);

    for (const reference of references) {
      const candidatePaths = buildCandidatePaths(htmlFile, reference.normalized);
      const exists = candidatePaths.some((candidate) => fs.existsSync(candidate));

      if (exists) {
        continue;
      }

      missingReferences.push({
        source: path.relative(projectRoot, htmlFile),
        attrName: reference.attrName,
        rawValue: reference.rawValue,
        checkedPath: path.relative(projectRoot, candidatePaths[0]),
      });
    }
  }

  if (missingReferences.length > 0) {
    console.error('Broken local HTML references found:');
    for (const item of missingReferences) {
      console.error(
        `- ${item.source}: ${item.attrName}="${item.rawValue}" -> missing ${item.checkedPath}`,
      );
    }
    process.exit(1);
  }

  console.log(`Local HTML reference check passed (${htmlFiles.length} files scanned).`);
}

validateLocalLinks();
