const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const packageRoot = path.join(projectRoot, 'dist');
const packageBaseUrl = 'https://package.invalid/';

const failures = [];
const summary = {
  htmlFiles: 0,
  formActions: 0,
  viteAssets: 0,
  staticPrecache: 0,
  canonicals: 0,
  sitemapUrls: 0,
};

function addFailure(type, source, message) {
  failures.push({ type, source, message });
}

function getAttribute(tag, attributeName) {
  const pattern = new RegExp(
    `\\b${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\u0060]+))`,
    'i',
  );
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

function decodeMarkupValue(value) {
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|(amp|quot|apos|lt|gt));/gi,
    (entity, decimal, hexadecimal, named) => {
      if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
      if (hexadecimal) return String.fromCodePoint(Number.parseInt(hexadecimal, 16));

      return {
        amp: '&',
        quot: '"',
        apos: "'",
        lt: '<',
        gt: '>',
      }[named.toLowerCase()];
    },
  );
}

function getPackageHtmlFiles(directory) {
  const files = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...getPackageHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function isLocalReference(reference) {
  const trimmed = reference.trim();
  if (!trimmed || trimmed.startsWith('//')) return false;
  return !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed);
}

function getPackageCandidates(pathname) {
  let decodedPathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch (error) {
    return { error: `cannot decode pathname ${JSON.stringify(pathname)}: ${error.message}` };
  }

  const packagePath = decodedPathname.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!packagePath) return { candidates: ['index.html'], normalized: 'index.html' };

  const candidates = [];
  if (packagePath.endsWith('/')) {
    candidates.push(`${packagePath}index.html`);
  } else {
    candidates.push(packagePath);
    if (!path.posix.extname(packagePath)) {
      candidates.push(`${packagePath}.html`, `${packagePath}/index.html`);
    }
  }

  const uniqueCandidates = [...new Set(candidates)];
  for (const candidate of uniqueCandidates) {
    const resolved = path.resolve(packageRoot, candidate.split('/').join(path.sep));
    const relative = path.relative(packageRoot, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return { error: `pathname resolves outside dist/: ${JSON.stringify(pathname)}` };
    }
  }

  return {
    candidates: uniqueCandidates,
    normalized: uniqueCandidates.length === 1 ? uniqueCandidates[0] : packagePath,
  };
}

function validatePackageTarget(type, source, rawValue, pathname) {
  const resolution = getPackageCandidates(pathname);
  if (resolution.error) {
    addFailure(type, source, `${JSON.stringify(rawValue)} -> ${resolution.error}`);
    return;
  }

  const existingTarget = resolution.candidates.find((candidate) => {
    const resolved = path.resolve(packageRoot, candidate.split('/').join(path.sep));
    return fs.existsSync(resolved) && fs.statSync(resolved).isFile();
  });

  if (existingTarget) return;

  const checked = resolution.candidates.map((candidate) => `dist/${candidate}`).join(', ');
  addFailure(
    type,
    source,
    `${JSON.stringify(rawValue)} -> missing normalized target ${resolution.normalized} (checked: ${checked})`,
  );
}

function parseAbsoluteWebUrl(type, source, rawValue) {
  let parsed;
  try {
    parsed = new URL(decodeMarkupValue(rawValue.trim()));
  } catch (error) {
    addFailure(type, source, `${JSON.stringify(rawValue)} -> invalid absolute URL: ${error.message}`);
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    addFailure(type, source, `${JSON.stringify(rawValue)} -> unsupported URL protocol ${parsed.protocol}`);
    return null;
  }

  return parsed;
}

function validateBuiltHtml(htmlFiles) {
  for (const htmlFile of htmlFiles) {
    const source = path.relative(packageRoot, htmlFile).replace(/\\/g, '/');
    const html = fs.readFileSync(htmlFile, 'utf8');

    const formPattern = /<form\b[^>]*>/gi;
    let formMatch;
    while ((formMatch = formPattern.exec(html)) !== null) {
      const rawAction = getAttribute(formMatch[0], 'action');
      if (rawAction === null || !rawAction.trim() || !isLocalReference(rawAction)) continue;

      summary.formActions += 1;
      const action = decodeMarkupValue(rawAction.trim());
      let parsed;
      try {
        parsed = new URL(action, new URL(source, packageBaseUrl));
      } catch (error) {
        addFailure('form action', source, `${JSON.stringify(rawAction)} -> invalid local URL: ${error.message}`);
        continue;
      }

      validatePackageTarget('form action', source, rawAction, parsed.pathname);
    }

    const linkPattern = /<link\b[^>]*>/gi;
    let linkMatch;
    while ((linkMatch = linkPattern.exec(html)) !== null) {
      const rel = getAttribute(linkMatch[0], 'rel');
      if (!rel || !rel.toLowerCase().split(/\s+/).includes('canonical')) continue;

      summary.canonicals += 1;
      const rawHref = getAttribute(linkMatch[0], 'href');
      if (rawHref === null || !rawHref.trim()) {
        addFailure('canonical URL', source, 'canonical link is missing a non-empty href');
        continue;
      }

      const parsed = parseAbsoluteWebUrl('canonical URL', source, rawHref);
      if (parsed) validatePackageTarget('canonical URL', source, rawHref, parsed.pathname);
    }
  }
}

function decodeJsString(quote, body) {
  if (quote === '"') return JSON.parse(`"${body}"`);

  return body.replace(/\\([\\'\u0060nrtbfv])/g, (escape, character) => {
    return {
      '\\': '\\',
      "'": "'",
      '\u0060': '\u0060',
      n: '\n',
      r: '\r',
      t: '\t',
      b: '\b',
      f: '\f',
      v: '\v',
    }[character];
  });
}

function extractArray(swContent, name) {
  const pattern = new RegExp(`const\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*;`);
  const match = swContent.match(pattern);
  if (!match) return null;

  const values = [];
  const stringPattern = /(["'\u0060])((?:\\[\s\S]|(?!\1)[\s\S])*)\1/g;
  let stringMatch;
  while ((stringMatch = stringPattern.exec(match[1])) !== null) {
    values.push(decodeJsString(stringMatch[1], stringMatch[2]));
  }

  return { body: match[1], values };
}

function validatePrecacheValues(type, source, values) {
  let localCount = 0;

  for (const rawValue of values) {
    if (!isLocalReference(rawValue)) continue;
    localCount += 1;

    let parsed;
    try {
      parsed = new URL(rawValue, packageBaseUrl);
    } catch (error) {
      addFailure(type, source, `${JSON.stringify(rawValue)} -> invalid local URL: ${error.message}`);
      continue;
    }

    validatePackageTarget(type, source, rawValue, parsed.pathname);
  }

  return localCount;
}

function validateServiceWorker() {
  const source = 'sw.js';
  const swPath = path.join(packageRoot, source);
  if (!fs.existsSync(swPath)) {
    addFailure('service-worker precache', source, 'missing dist/sw.js');
    return;
  }

  const swContent = fs.readFileSync(swPath, 'utf8');
  let viteAssets;
  let staticPrecache;

  try {
    viteAssets = extractArray(swContent, 'VITE_ASSET_URLS');
    staticPrecache = extractArray(swContent, 'PRECACHE_URLS');
  } catch (error) {
    addFailure('service-worker precache', source, `cannot parse URL declarations: ${error.message}`);
    return;
  }

  if (!viteAssets) {
    addFailure('Vite asset precache', source, 'missing VITE_ASSET_URLS array');
  } else {
    summary.viteAssets = validatePrecacheValues(
      'Vite asset precache',
      source,
      viteAssets.values,
    );
    if (summary.viteAssets === 0) {
      addFailure('Vite asset precache', source, 'VITE_ASSET_URLS contains no local package targets');
    }
  }

  if (!staticPrecache) {
    addFailure('static precache', source, 'missing PRECACHE_URLS array');
    return;
  }

  summary.staticPrecache = validatePrecacheValues(
    'static precache',
    source,
    staticPrecache.values,
  );

  if (!/\.\.\.\s*VITE_ASSET_URLS\b/.test(staticPrecache.body)) {
    addFailure('service-worker precache', source, 'PRECACHE_URLS does not include VITE_ASSET_URLS');
  }
}

function validateSitemap() {
  const source = 'sitemap.xml';
  const sitemapPath = path.join(packageRoot, source);
  if (!fs.existsSync(sitemapPath)) {
    addFailure('sitemap URL', source, 'missing dist/sitemap.xml');
    return;
  }

  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const locPattern = /<loc\b[^>]*>([\s\S]*?)<\/loc>/gi;
  const locations = [];
  let match;
  while ((match = locPattern.exec(sitemap)) !== null) {
    locations.push(match[1].trim());
  }

  if (locations.length === 0) {
    addFailure('sitemap URL', source, 'sitemap contains no <loc> entries');
    return;
  }

  for (const rawLocation of locations) {
    summary.sitemapUrls += 1;
    const parsed = parseAbsoluteWebUrl('sitemap URL', source, rawLocation);
    if (parsed) validatePackageTarget('sitemap URL', source, rawLocation, parsed.pathname);
  }
}

function checkPackage() {
  if (!fs.existsSync(packageRoot) || !fs.statSync(packageRoot).isDirectory()) {
    console.error('Package smoke check failed:');
    console.error('- package (dist/): expected generated Vite package does not exist');
    process.exit(1);
  }

  const htmlFiles = getPackageHtmlFiles(packageRoot);
  summary.htmlFiles = htmlFiles.length;
  if (htmlFiles.length === 0) {
    addFailure('package HTML', 'dist/', 'package contains no built HTML files');
  } else {
    validateBuiltHtml(htmlFiles);
  }

  validateServiceWorker();
  validateSitemap();

  if (failures.length > 0) {
    console.error('Package smoke check failed:');
    failures
      .sort((a, b) => `${a.type}\0${a.source}\0${a.message}`.localeCompare(`${b.type}\0${b.source}\0${b.message}`))
      .forEach((failure) => {
        console.error(`- ${failure.type} (${failure.source}): ${failure.message}`);
      });
    process.exit(1);
  }

  const totalPrecache = summary.staticPrecache + summary.viteAssets;
  console.log(
    `Package smoke check passed (${summary.htmlFiles} HTML files; ${summary.formActions} local form actions; ${totalPrecache} service-worker precache targets: ${summary.staticPrecache} static + ${summary.viteAssets} Vite assets; ${summary.canonicals} canonical targets; ${summary.sitemapUrls} sitemap targets).`,
  );
}

checkPackage();
