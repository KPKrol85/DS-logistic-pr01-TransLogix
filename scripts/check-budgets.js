#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const rootDir = path.resolve(__dirname, '..');
const budgetsPath = path.join(rootDir, 'perf-budgets.json');

function formatBytes(bytes) {
  return `${bytes} B (${(bytes / 1024).toFixed(2)} KB)`;
}

function loadBudgets() {
  if (!fs.existsSync(budgetsPath)) {
    throw new Error(`Missing budgets file: ${path.relative(rootDir, budgetsPath)}`);
  }

  const raw = fs.readFileSync(budgetsPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== 'object' || !parsed.budgets || typeof parsed.budgets !== 'object') {
    throw new Error('Invalid perf-budgets.json format. Expected: { "budgets": { "path": { "max_gzip_bytes": number } } }');
  }

  return parsed.budgets;
}

function extractStaticImports(source) {
  const imports = [];
  const importRegex = /import\s+(?:[^'"]+?\s+from\s+)?["'](.+?)["']/g;

  let match;
  while ((match = importRegex.exec(source)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

function resolveImportPath(fromPath, importPath) {
  if (!importPath.startsWith('.')) return null;

  const basePath = path.resolve(path.dirname(fromPath), importPath);
  const candidates = path.extname(basePath) ? [basePath] : [`${basePath}.js`, path.join(basePath, 'index.js')];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function collectModuleGraph(entryPath, seen = new Set()) {
  const resolvedEntry = path.resolve(entryPath);
  if (seen.has(resolvedEntry)) return [];

  seen.add(resolvedEntry);

  if (!fs.existsSync(resolvedEntry)) {
    return [resolvedEntry];
  }

  const source = fs.readFileSync(resolvedEntry, 'utf8');
  const files = [resolvedEntry];

  for (const importPath of extractStaticImports(source)) {
    const resolvedImport = resolveImportPath(resolvedEntry, importPath);
    if (!resolvedImport) continue;

    files.push(...collectModuleGraph(resolvedImport, seen));
  }

  return files;
}

function getBudgetFiles(absolutePath, type) {
  if (!type || type === 'file') {
    return [absolutePath];
  }

  if (type === 'module_graph') {
    return collectModuleGraph(absolutePath);
  }

  throw new Error(`Unsupported budget type "${type}" for ${path.relative(rootDir, absolutePath)}`);
}

function checkBudgets() {
  const budgets = loadBudgets();
  const results = [];
  let hasFailures = false;

  for (const [assetPath, config] of Object.entries(budgets)) {
    const absolutePath = path.join(rootDir, assetPath);
    const maxGzipBytes = config?.max_gzip_bytes;
    const budgetType = config?.type || 'file';

    if (!Number.isFinite(maxGzipBytes) || maxGzipBytes <= 0) {
      throw new Error(`Invalid max_gzip_bytes for ${assetPath}`);
    }

    const budgetFiles = getBudgetFiles(absolutePath, budgetType);
    const missingFiles = budgetFiles.filter((filePath) => !fs.existsSync(filePath));

    if (missingFiles.length > 0) {
      hasFailures = true;
      results.push({
        assetPath,
        type: budgetType,
        status: 'FAIL',
        message: `File not found: ${missingFiles.map((filePath) => path.relative(rootDir, filePath)).join(', ')}`,
      });
      continue;
    }

    const gzipBytes = budgetFiles.reduce((total, filePath) => {
      const content = fs.readFileSync(filePath);
      return total + zlib.gzipSync(content).length;
    }, 0);
    const withinBudget = gzipBytes <= maxGzipBytes;

    if (!withinBudget) {
      hasFailures = true;
    }

    results.push({
      assetPath,
      type: budgetType,
      fileCount: budgetFiles.length,
      status: withinBudget ? 'PASS' : 'FAIL',
      gzipBytes,
      maxGzipBytes,
    });
  }

  console.log('Performance budget check (gzip):');
  for (const result of results) {
    if (result.message) {
      console.log(`- [${result.status}] ${result.assetPath}: ${result.message}`);
      continue;
    }

    const typeLabel = result.type === 'module_graph' ? `, ${result.fileCount} files` : '';
    const delta = result.gzipBytes - result.maxGzipBytes;
    const deltaLabel = delta <= 0 ? `${Math.abs(delta)} B under` : `${delta} B over`;
    console.log(
      `- [${result.status}] ${result.assetPath} (${result.type}${typeLabel}): ${formatBytes(result.gzipBytes)} / limit ${formatBytes(result.maxGzipBytes)} (${deltaLabel})`
    );
  }

  if (hasFailures) {
    console.error('\nBudget check failed.');
    process.exit(1);
  }

  console.log('\nAll budgets passed.');
}

try {
  checkBudgets();
} catch (error) {
  console.error(`Budget check error: ${error.message}`);
  process.exit(1);
}
