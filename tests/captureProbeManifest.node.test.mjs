import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildAddonPackage, buildManifest } from '../scripts/build-addon-package.mjs';
import { writeReportManifest } from '../scripts/write-report-manifest.mjs';

test('buildManifest describes the capture-probe addon as diagnostic-only with two addon actions and one runtime surface', () => {
  const manifest = buildManifest();

  assert.equal(manifest.addon.addon_id, 'axolync-addon-songsense-capture-probe');
  assert.equal(manifest.addon.contracts_version, '2.0.0');
  assert.match(manifest.addon.description ?? '', /diagnostic-only/i);
  assert.equal(manifest.addon.addon_actions.length, 2);
  assert.equal(manifest.addon.addon_runtime_data_surfaces.length, 1);
  assert.equal(manifest.addon.addon_runtime_data_surfaces[0]?.surface_id, 'capture_summary');
  assert.equal(manifest.addon.adapters[0]?.adapter_id, 'CaptureProbeSongSenseAdapter');
  assert.equal(manifest.addon.adapters[0]?.runtime_code_state, 'implemented');
  assert.equal(manifest.addon.adapters[0]?.required_host_capabilities?.[0], 'addon-action-download-save');
  assert.match(manifest.addon.adapters[0]?.notes ?? '', /action-boundary truth only/i);
  assert.equal(manifest.addon.adapters[0]?.query_methods?.songsense?.[0], 'query_song_candidates');
});

test('report manifest stays aligned with the scaffolded addon manifest truth', () => {
  const { manifest: reportManifest } = writeReportManifest();
  const builtManifest = buildManifest();
  assert.deepEqual(reportManifest, builtManifest);
});

test('package scaffolding emits a zip root with the diagnostic adapter and addon action bundles', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'axolync-capture-probe-package-'));
  try {
    const built = buildAddonPackage({ outputRoot });
    assert.ok(fs.existsSync(built.zipPath), `Expected package zip at ${built.zipPath}`);
    const relativeFiles = built.contents.files;
    assert.deepEqual(relativeFiles, [
      'actions/clear-capture.js',
      'actions/download-capture.js',
      'adapters/CaptureProbeSongSenseAdapter/index.js',
      'manifest.json',
    ]);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});
