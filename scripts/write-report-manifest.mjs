import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import addon from '../addon/addon.meta.mjs';
import { buildManifestFromAddon } from './lib/package-manifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const reportDir = path.join(repoRoot, 'report');
const reportPath = path.join(reportDir, 'addon-manifest.songsense-capture-probe.json');

export function writeReportManifest() {
  fs.mkdirSync(reportDir, { recursive: true });
  const manifest = buildManifestFromAddon(addon);
  fs.writeFileSync(reportPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return {
    manifest,
    reportPath,
  };
}

const directEntryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (directEntryPath && fileURLToPath(import.meta.url) === directEntryPath) {
  const result = writeReportManifest();
  process.stdout.write(`${result.reportPath}\n`);
}
