import test from 'node:test';
import assert from 'node:assert/strict';

import addon from '../addon/addon.meta.mjs';

test('capture-probe addon metadata exposes one diagnostic SongSense adapter, two addon actions, and one runtime summary surface', () => {
  assert.equal(addon.addonId, 'axolync-addon-songsense-capture-probe');
  assert.equal(addon.adapters.length, 1);
  assert.equal(addon.adapters[0]?.adapterId, 'CaptureProbeSongSenseAdapter');
  assert.equal(addon.addonActions.length, 2);
  assert.deepEqual(addon.addonActions.map((action) => action.actionId), [
    'download_capture',
    'clear_capture',
  ]);
  assert.equal(addon.addonRuntimeDataSurfaces.length, 1);
  assert.equal(addon.addonRuntimeDataSurfaces[0]?.surfaceId, 'capture_summary');
  assert.equal(addon.addonRuntimeDataSurfaces[0]?.sections[0]?.kind, 'facts');
  assert.equal(addon.addonRuntimeDataSurfaces[0]?.sections[0]?.facts[0]?.factId, 'has_capture');
  assert.equal(addon.addonRuntimeDataSurfaces[0]?.sections[0]?.facts[0]?.value, 'No');
  assert.equal(addon.addonRuntimeDataSurfaces[0]?.sections[0]?.facts[1]?.value, '0 ms');
  assert.equal(addon.addonRuntimeDataSurfaces[0]?.sections[0]?.facts[5]?.value, 'action-boundary');
  assert.equal(addon.adapters[0]?.runtimeCodeState, 'implemented');
  assert.equal(addon.adapters[0]?.requiredHostCapabilities[0], 'addon-action-download-save');
});
