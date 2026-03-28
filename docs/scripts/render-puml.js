#!/usr/bin/env node
/**
 * Renders all .puml files under docs/ to .png using the PlantUML online server.
 * Usage: node docs/scripts/render-puml.js [optional-specific-dir]
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const https = require('https');

const PLANTUML_SERVER = 'https://www.plantuml.com/plantuml/png/';
const CONCURRENCY = 4;

function encode6bit(b) {
  if (b < 10) return String.fromCharCode(48 + b);
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b);
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b);
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
}

function encode64(data) {
  let r = '';
  for (let i = 0; i < data.length; i += 3) {
    const b1 = data[i];
    const b2 = i + 1 < data.length ? data[i + 1] : 0;
    const b3 = i + 2 < data.length ? data[i + 2] : 0;
    r += encode6bit(b1 >> 2);
    r += encode6bit(((b1 & 0x3) << 4) | (b2 >> 4));
    r += encode6bit(((b2 & 0xF) << 2) | (b3 >> 6));
    r += encode6bit(b3 & 0x3F);
  }
  return r;
}

function encodePlantUml(text) {
  const deflated = zlib.deflateRawSync(Buffer.from(text, 'utf-8'));
  return encode64(deflated);
}

function downloadPng(url, outputPath) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      const mod = u.startsWith('https') ? https : require('http');
      mod.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          fs.writeFileSync(outputPath, Buffer.concat(chunks));
          resolve();
        });
        res.on('error', reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

function findPumlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findPumlFiles(full));
    } else if (entry.name.endsWith('.puml')) {
      results.push(full);
    }
  }
  return results;
}

async function processFile(pumlPath) {
  const content = fs.readFileSync(pumlPath, 'utf-8');
  const pngPath = pumlPath.replace(/\.puml$/, '.png');
  const encoded = encodePlantUml(content);
  const url = PLANTUML_SERVER + encoded;
  await downloadPng(url, pngPath);
  const size = fs.statSync(pngPath).size;
  console.log(`  ✓ ${path.relative(process.cwd(), pngPath)} (${size} bytes)`);
}

async function processPool(files, concurrency) {
  let idx = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (idx < files.length) {
      const i = idx++;
      try {
        await processFile(files[i]);
      } catch (e) {
        console.error(`  ✗ ${files[i]}: ${e.message}`);
      }
    }
  });
  await Promise.all(workers);
}

async function main() {
  const searchDir = process.argv[2] || path.join(__dirname, '..');
  console.log(`Scanning ${searchDir} for .puml files...`);
  const files = findPumlFiles(searchDir);
  console.log(`Found ${files.length} .puml files. Rendering to PNG...\n`);
  await processPool(files, CONCURRENCY);
  console.log(`\nDone. Rendered ${files.length} diagrams.`);
}

main().catch(console.error);
