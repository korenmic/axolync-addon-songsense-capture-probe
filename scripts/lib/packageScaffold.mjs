import fs from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';

function ensureDir(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function collectBundleEntries(addon) {
  return [
    ...addon.adapters.map((adapter) => ({
      kind: 'adapter',
      id: adapter.adapterId,
      bundlePath: adapter.bundlePath,
      sourceFileUrl: adapter.sourceFileUrl,
      exportName: adapter.implementation.name,
    })),
    ...(addon.addonActions ?? []).map((action) => ({
      kind: 'action',
      id: action.actionId,
      bundlePath: action.bundlePath,
      sourceFileUrl: action.sourceFileUrl,
      exportName: action.handler.name,
    })),
  ];
}

export function bundleAddonModules({ addon, packageDir }) {
  const bundleOutputs = [];

  for (const entry of collectBundleEntries(addon)) {
    const entryPoint = fileURLToPath(entry.sourceFileUrl);
    const outputPath = path.join(packageDir, entry.bundlePath);
    ensureDir(path.dirname(outputPath));

    buildSync({
      entryPoints: [entryPoint],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2022',
      legalComments: 'none',
      outfile: outputPath,
      logLevel: 'silent',
    });

    bundleOutputs.push({
      kind: entry.kind,
      id: entry.id,
      bundlePath: entry.bundlePath,
      exportName: entry.exportName,
      outputPath,
    });
  }

  return bundleOutputs;
}

export function createStage1PackageScaffold({ addon, manifest, outputRoot }) {
  const packageDir = path.join(outputRoot, 'package-root');
  fs.rmSync(packageDir, { recursive: true, force: true });
  ensureDir(packageDir);

  const bundleOutputs = bundleAddonModules({ addon, packageDir });
  const manifestPath = path.join(packageDir, 'manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const contentsPath = path.join(outputRoot, 'package.contents.json');
  const contents = {
    addonId: addon.addonId,
    packageDir,
    files: ['manifest.json', ...bundleOutputs.map((output) => output.bundlePath)].sort(),
  };
  fs.writeFileSync(contentsPath, `${JSON.stringify(contents, null, 2)}\n`, 'utf8');

  return {
    packageDir,
    manifestPath,
    contentsPath,
    contents,
    bundleOutputs,
  };
}
