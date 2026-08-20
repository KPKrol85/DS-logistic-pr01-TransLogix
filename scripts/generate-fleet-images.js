const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const projectRoot = path.resolve(__dirname, "..");
const fleetPagePath = path.join(projectRoot, "fleet.html");
const fleetRoot = path.join(projectRoot, "assets", "img", "fleet");
const outputRoot = path.join(fleetRoot, "responsive");
const widths = [160, 320, 640];

const formatOptions = {
  avif: { quality: 50, effort: 5 },
  webp: { quality: 80, effort: 5 },
  jpg: { quality: 82, progressive: true, mozjpeg: true },
};

function collectCardSources(html) {
  const sources = new Set();
  const pattern = /data-main-jpg="([^"]+)"/g;

  for (const match of html.matchAll(pattern)) {
    sources.add(match[1]);
  }

  return [...sources].sort();
}

function getOutputPath(sourcePath, width, format) {
  const relativeSource = path.relative(fleetRoot, sourcePath);
  const parsed = path.parse(relativeSource);
  return path.join(outputRoot, parsed.dir, `${parsed.name}-${width}.${format}`);
}

async function generateVariant(sourcePath, width, format) {
  const outputPath = getOutputPath(sourcePath, width, format);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const pipeline = sharp(sourcePath).resize({
    width,
    withoutEnlargement: true,
  });
  if (format === "jpg") {
    await pipeline.jpeg(formatOptions.jpg).toFile(outputPath);
  } else {
    await pipeline[format](formatOptions[format]).toFile(outputPath);
  }

  const metadata = await sharp(outputPath).metadata();
  const expectedHeight = Math.round((width * 3) / 4);
  if (metadata.width !== width || metadata.height !== expectedHeight) {
    throw new Error(
      `Unexpected dimensions for ${path.relative(projectRoot, outputPath)}: ${metadata.width}x${metadata.height}`,
    );
  }
}

async function generateFleetImages() {
  const fleetPage = await fs.readFile(fleetPagePath, "utf8");
  const cardSources = collectCardSources(fleetPage);

  if (!cardSources.length) {
    throw new Error("No fleet card JPG sources were found in fleet.html.");
  }

  let generated = 0;
  for (const source of cardSources) {
    const sourcePath = path.resolve(projectRoot, source);
    const relativeSource = path.relative(fleetRoot, sourcePath);
    if (
      relativeSource.startsWith("..") ||
      path.isAbsolute(relativeSource) ||
      path.extname(sourcePath).toLowerCase() !== ".jpg"
    ) {
      throw new Error(
        `Fleet card source is outside the supported JPG inventory: ${source}`,
      );
    }

    const metadata = await sharp(sourcePath).metadata();
    if (metadata.width !== 800 || metadata.height !== 600) {
      throw new Error(
        `Expected an 800x600 fleet source, received ${metadata.width}x${metadata.height}: ${source}`,
      );
    }

    for (const width of widths) {
      for (const format of Object.keys(formatOptions)) {
        await generateVariant(sourcePath, width, format);
        generated += 1;
      }
    }
  }

  console.log(
    `Generated ${generated} responsive fleet image variants from ${cardSources.length} card sources.`,
  );
}

generateFleetImages().catch((error) => {
  console.error(`Fleet image generation failed: ${error.message}`);
  process.exitCode = 1;
});
