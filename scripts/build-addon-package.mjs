import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import addon from '../addon/addon.meta.mjs';
import { buildManifestFromAddon } from './lib/package-manifest.mjs';
import { createStage1PackageScaffold } from './lib/packageScaffold.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const defaultArtifactsRoot = path.join(repoRoot, 'artifacts', 'output', 'local_js');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildZipFromStaging(stagingRoot, zipPath) {
  const python = process.platform === 'win32' ? 'python' : 'python3';
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'axolync-capture-probe-zip-'));
  const tempScriptPath = path.join(tempDir, 'zip.py');
  fs.writeFileSync(
    tempScriptPath,
    [
      'import pathlib, sys, zipfile',
      'root = pathlib.Path(sys.argv[1])',
      'zip_path = pathlib.Path(sys.argv[2])',
      'fixed_date = (1980, 1, 1, 0, 0, 0)',
      "zip_path.parent.mkdir(parents=True, exist_ok=True)",
      "with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as archive:",
      "    for file_path in sorted(root.rglob('*')):",
      "        if file_path.is_file():",
      "            info = zipfile.ZipInfo(file_path.relative_to(root).as_posix(), fixed_date)",
      "            info.compress_type = zipfile.ZIP_DEFLATED",
      "            archive.writestr(info, file_path.read_bytes())",
    ].join('\n'),
    'utf8',
  );

  const result = spawnSync(python, [tempScriptPath, stagingRoot, zipPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  fs.rmSync(tempDir, { recursive: true, force: true });

  if (result.status !== 0) {
    throw new Error(`Failed to package addon zip: ${result.stderr || result.stdout || 'unknown error'}`);
  }
}

export function buildManifest() {
  return buildManifestFromAddon(addon);
}

export function buildAddonPackage(options = {}) {
  const outputRoot = options.outputRoot ?? defaultArtifactsRoot;
  const zipPath = path.join(outputRoot, 'axolync-addon-songsense-capture-probe-local_js.zip');
  ensureDir(outputRoot);
  const manifest = buildManifest();
  const scaffold = createStage1PackageScaffold({
    addon,
    manifest,
    outputRoot,
  });
  buildZipFromStaging(scaffold.packageDir, zipPath);
  return {
    manifest,
    zipPath,
    contentsPath: scaffold.contentsPath,
    contents: scaffold.contents,
    bundleOutputs: scaffold.bundleOutputs,
    stagingRoot: scaffold.packageDir,
  };
}

const directEntryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (directEntryPath && fileURLToPath(import.meta.url) === directEntryPath) {
  const result = buildAddonPackage();
  process.stdout.write(
    JSON.stringify(
      {
        zipPath: result.zipPath,
        fileCount: result.contents.files.length,
      },
      null,
      2,
    ) + '\n',
  );
}
