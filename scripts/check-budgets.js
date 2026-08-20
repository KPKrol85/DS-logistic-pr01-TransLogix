#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const rootDir = path.resolve(__dirname, "..");
const budgetsPath = path.join(rootDir, "perf-budgets.json");
const supportedAssetTypes = new Set(["css", "javascript"]);

function formatBytes(bytes) {
  return `${bytes} B (${(bytes / 1024).toFixed(2)} KB)`;
}

function loadBudgets() {
  if (!fs.existsSync(budgetsPath)) {
    throw new Error(
      `Missing budgets file: ${path.relative(rootDir, budgetsPath)}`,
    );
  }

  const raw = fs.readFileSync(budgetsPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid perf-budgets.json: ${error.message}`);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !parsed.vite_output ||
    typeof parsed.vite_output !== "object"
  ) {
    throw new Error(
      'Invalid perf-budgets.json format. Missing "vite_output" configuration.',
    );
  }

  const { directory, manifest } = parsed.vite_output;
  if (typeof directory !== "string" || directory.trim() === "") {
    throw new Error(
      'Invalid perf-budgets.json format. "vite_output.directory" must be a non-empty string.',
    );
  }
  if (typeof manifest !== "string" || manifest.trim() === "") {
    throw new Error(
      'Invalid perf-budgets.json format. "vite_output.manifest" must be a non-empty string.',
    );
  }
  if (
    !parsed.budgets ||
    typeof parsed.budgets !== "object" ||
    Array.isArray(parsed.budgets)
  ) {
    throw new Error(
      'Invalid perf-budgets.json format. "budgets" must be an object.',
    );
  }

  const configuredAssetTypes = Object.values(parsed.budgets).map(
    (budget) => budget?.asset_type,
  );
  for (const requiredAssetType of supportedAssetTypes) {
    if (!configuredAssetTypes.includes(requiredAssetType)) {
      throw new Error(
        `Invalid perf-budgets.json format. Missing required ${requiredAssetType} budget.`,
      );
    }
  }

  return {
    outputDirectory: path.resolve(rootDir, directory),
    manifestPath: path.resolve(rootDir, directory, manifest),
    budgets: parsed.budgets,
  };
}

function loadManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Missing Vite manifest: ${path.relative(rootDir, manifestPath)}. Run the current Vite production build before checking budgets.`,
    );
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Invalid Vite manifest ${path.relative(rootDir, manifestPath)}: ${error.message}`,
    );
  }

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error(
      `Invalid Vite manifest ${path.relative(rootDir, manifestPath)}: expected an object.`,
    );
  }

  return manifest;
}

function collectViteAssets(manifest, assetType) {
  const files = new Set();
  const matchesAssetType =
    assetType === "css"
      ? (filePath) => filePath.endsWith(".css")
      : (filePath) => /\.[cm]?js$/.test(filePath);

  for (const [sourcePath, entry] of Object.entries(manifest)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`Invalid Vite manifest entry for "${sourcePath}".`);
    }

    if (typeof entry.file === "string" && matchesAssetType(entry.file)) {
      files.add(entry.file);
    }

    if (assetType === "css" && entry.css !== undefined) {
      if (
        !Array.isArray(entry.css) ||
        entry.css.some((filePath) => typeof filePath !== "string")
      ) {
        throw new Error(
          `Invalid CSS asset list in Vite manifest entry for "${sourcePath}".`,
        );
      }

      for (const filePath of entry.css) {
        if (matchesAssetType(filePath)) {
          files.add(filePath);
        }
      }
    }
  }

  return [...files].sort();
}

function resolveOutputFile(outputDirectory, assetPath) {
  const absolutePath = path.resolve(outputDirectory, assetPath);
  const relativePath = path.relative(outputDirectory, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(
      `Vite manifest asset resolves outside the production output: ${assetPath}`,
    );
  }

  return absolutePath;
}

function checkBudgets() {
  const { outputDirectory, manifestPath, budgets } = loadBudgets();
  const manifest = loadManifest(manifestPath);
  const results = [];
  let hasFailures = false;

  for (const [budgetName, config] of Object.entries(budgets)) {
    const maxGzipBytes = config?.max_gzip_bytes;
    const assetType = config?.asset_type;

    if (!Number.isFinite(maxGzipBytes) || maxGzipBytes <= 0) {
      throw new Error(`Invalid max_gzip_bytes for ${budgetName}`);
    }
    if (!supportedAssetTypes.has(assetType)) {
      throw new Error(
        `Unsupported asset_type "${assetType}" for ${budgetName}`,
      );
    }

    const assetPaths = collectViteAssets(manifest, assetType);
    if (assetPaths.length === 0) {
      hasFailures = true;
      results.push({
        budgetName,
        assetType,
        status: "FAIL",
        message: `Vite manifest resolved no production ${assetType} files.`,
      });
      continue;
    }

    const budgetFiles = assetPaths.map((assetPath) => ({
      assetPath,
      absolutePath: resolveOutputFile(outputDirectory, assetPath),
    }));
    const missingFiles = budgetFiles.filter(
      ({ absolutePath }) => !fs.existsSync(absolutePath),
    );

    if (missingFiles.length > 0) {
      hasFailures = true;
      results.push({
        budgetName,
        assetType,
        status: "FAIL",
        message: `Production file not found: ${missingFiles
          .map(({ absolutePath }) => path.relative(rootDir, absolutePath))
          .join(", ")}`,
      });
      continue;
    }

    const files = budgetFiles.map(({ absolutePath }) => {
      const gzipBytes = zlib.gzipSync(fs.readFileSync(absolutePath)).length;
      return {
        path: path.relative(rootDir, absolutePath),
        gzipBytes,
      };
    });
    const gzipBytes = files.reduce((total, file) => total + file.gzipBytes, 0);
    const withinBudget = gzipBytes <= maxGzipBytes;

    if (!withinBudget) {
      hasFailures = true;
    }

    results.push({
      budgetName,
      assetType,
      files,
      status: withinBudget ? "PASS" : "FAIL",
      gzipBytes,
      maxGzipBytes,
    });
  }

  console.log("Performance budget check (gzip):");
  for (const result of results) {
    if (result.message) {
      console.log(
        `- [${result.status}] ${result.budgetName} (${result.assetType}): ${result.message}`,
      );
      continue;
    }

    const delta = result.gzipBytes - result.maxGzipBytes;
    const deltaLabel =
      delta <= 0 ? `${Math.abs(delta)} B under` : `${delta} B over`;
    console.log(
      `- [${result.status}] ${result.budgetName} (${result.assetType}, ${result.files.length} ${result.files.length === 1 ? "file" : "files"}): ${formatBytes(result.gzipBytes)} / limit ${formatBytes(result.maxGzipBytes)} (${deltaLabel})`,
    );
    for (const file of result.files) {
      console.log(`  - ${file.path}: ${formatBytes(file.gzipBytes)} gzip`);
    }
  }

  if (hasFailures) {
    console.error("\nBudget check failed.");
    process.exit(1);
  }

  console.log("\nAll budgets passed.");
}

try {
  checkBudgets();
} catch (error) {
  console.error(`Budget check error: ${error.message}`);
  process.exit(1);
}
