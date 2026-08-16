#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const sourceHtmlDirectories = [
  path.join(projectRoot, 'partials'),
  path.join(projectRoot, 'templates'),
];

function getRootHtmlFiles() {
  return fs
    .readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => path.join(projectRoot, entry.name));
}

function getHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getHtmlFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

const sourceHtmlFiles = [
  ...getRootHtmlFiles(),
  ...sourceHtmlDirectories.flatMap((dir) => getHtmlFiles(dir)),
];

const relativeFiles = sourceHtmlFiles
  .map((filePath) => path.relative(projectRoot, filePath))
  .sort();

if (relativeFiles.length === 0) {
  console.error('No source HTML files found to validate.');
  process.exit(1);
}

const result = spawnSync('html-validate', relativeFiles, {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
