const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
let sharp;

const projectRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(projectRoot, "assets/img/src_img");
const outputDir = path.join(projectRoot, "assets/img/opt_img");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png"]);

const WEBP_OPTIONS = {
  quality: 80,
  effort: 5,
};

const AVIF_OPTIONS = {
  quality: 50,
  effort: 5,
};

function getSharp() {
  if (sharp) return sharp;

  try {
    // Lazy-load so the script can show a clear message when dependency is missing.
    // eslint-disable-next-line global-require
    sharp = require("sharp");
    return sharp;
  } catch (error) {
    console.error('Missing dependency: sharp. Run "npm install" before "npm run img:opt".');
    process.exit(1);
  }
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function collectImageFiles(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectImageFiles(fullPath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (supportedExtensions.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function fileIsUpToDate(inputFile, outputFile) {
  try {
    const [inputStat, outputStat] = await Promise.all([fsp.stat(inputFile), fsp.stat(outputFile)]);
    return outputStat.mtimeMs >= inputStat.mtimeMs;
  } catch {
    return false;
  }
}

async function convertToFormat(inputFile, outputFile, format, options) {
  await fsp.mkdir(path.dirname(outputFile), { recursive: true });
  const sharpInstance = getSharp();
  await sharpInstance(inputFile)[format](options).toFile(outputFile);
}

async function optimizeImages() {
  let errors = 0;
  let converted = 0;
  let skipped = 0;

  if (!fs.existsSync(sourceDir)) {
    console.log("No src_img directory found. Nothing to optimize.");
    process.exit(0);
  }

  const sourceFiles = await collectImageFiles(sourceDir);
  console.log(`Found ${sourceFiles.length} source image(s).`);

  for (const sourceFile of sourceFiles) {
    const relativePath = path.relative(sourceDir, sourceFile);
    const outputBasePath = path.join(outputDir, relativePath).replace(/\.[^.]+$/, "");

    const targets = [
      { format: "webp", options: WEBP_OPTIONS, outputFile: `${outputBasePath}.webp` },
      { format: "avif", options: AVIF_OPTIONS, outputFile: `${outputBasePath}.avif` },
    ];

    for (const target of targets) {
      const isUpToDate = await fileIsUpToDate(sourceFile, target.outputFile);

      if (isUpToDate) {
        skipped += 1;
        continue;
      }

      try {
        await convertToFormat(sourceFile, target.outputFile, target.format, target.options);
        converted += 1;
      } catch (error) {
        errors += 1;
        console.error(`Failed to convert ${toPosixPath(path.relative(projectRoot, sourceFile))} -> ${toPosixPath(path.relative(projectRoot, target.outputFile))}`);
        console.error(`  ${error.message}`);
      }
    }
  }

  console.log(`Converted: ${converted}, skipped: ${skipped}, errors: ${errors}`);

  if (errors > 0) {
    process.exit(1);
  }
}

optimizeImages().catch((error) => {
  console.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
