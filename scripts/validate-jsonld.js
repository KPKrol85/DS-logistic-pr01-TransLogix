const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const jsonLdScriptRegex =
  /<script\b(?=[^>]*\btype\s*=\s*(["'])application\/ld\+json\1)[^>]*>([\s\S]*?)<\/script>/gi;

function getRootHtmlFiles() {
  return fs
    .readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => path.join(projectRoot, entry.name))
    .sort();
}

function formatFilePath(filePath) {
  return path.relative(projectRoot, filePath);
}

function getJsonLdBlocks(htmlContent) {
  const blocks = [];
  let match;

  while ((match = jsonLdScriptRegex.exec(htmlContent)) !== null) {
    blocks.push(match[2].trim());
  }

  return blocks;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function hasRequiredJsonLdFields(value) {
  return Boolean(isPlainObject(value) && value['@context'] && value['@type']);
}

function validateJsonLdObject(value, location) {
  if (!isPlainObject(value)) {
    throw new Error(`${location}: JSON-LD value must be an object`);
  }

  if (value['@graph']) {
    if (!value['@context']) {
      throw new Error(`${location}: missing @context`);
    }

    if (!Array.isArray(value['@graph']) || value['@graph'].length === 0) {
      throw new Error(`${location}: @graph must be a non-empty array`);
    }

    value['@graph'].forEach((item, index) => {
      if (!isPlainObject(item) || !item['@type']) {
        throw new Error(`${location}, graph item ${index + 1}: missing @type`);
      }
    });

    return;
  }

  if (!hasRequiredJsonLdFields(value)) {
    throw new Error(`${location}: missing @context or @type`);
  }
}

function validateJsonLdPayload(payload, filePath, blockNumber) {
  let parsed;

  try {
    parsed = JSON.parse(payload);
  } catch (error) {
    throw new Error(`${formatFilePath(filePath)} block ${blockNumber}: invalid JSON (${error.message})`);
  }

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error(`${formatFilePath(filePath)} block ${blockNumber}: JSON-LD array must not be empty`);
    }

    parsed.forEach((item, index) => {
      validateJsonLdObject(item, `${formatFilePath(filePath)} block ${blockNumber}, item ${index + 1}`);
    });

    return;
  }

  validateJsonLdObject(parsed, `${formatFilePath(filePath)} block ${blockNumber}`);
}

function validateJsonLd() {
  const htmlFiles = getRootHtmlFiles();
  const errors = [];
  let validatedBlocks = 0;

  for (const htmlFile of htmlFiles) {
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const blocks = getJsonLdBlocks(htmlContent);

    blocks.forEach((block, index) => {
      try {
        validateJsonLdPayload(block, htmlFile, index + 1);
        validatedBlocks += 1;
      } catch (error) {
        errors.push(error.message);
      }
    });
  }

  if (errors.length > 0) {
    console.error('JSON-LD validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`JSON-LD validation passed (${validatedBlocks} blocks validated).`);
}

validateJsonLd();
