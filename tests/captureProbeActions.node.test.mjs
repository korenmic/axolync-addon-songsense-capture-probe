import test from 'node:test';
import assert from 'node:assert/strict';

import { downloadCaptureAction } from '../addon/actions/downloadCaptureAction.js';
import { clearCaptureAction } from '../addon/actions/clearCaptureAction.js';
import { replaceCaptureSessionWindow, getCaptureSessionState, resetCaptureSessionStoreForTests } from '../addon/runtime/captureSessionStore.js';
import {
  CAPTURE_LAST_DIAGNOSTIC_STATE_KEY,
  ADDON_RUNTIME_DATA_SURFACES_STATE_KEY,
  CAPTURE_SUMMARY_SNAPSHOT_STATE_KEY,
} from '../addon/runtime/captureSummaryState.js';

const addonIdentity = Object.freeze({
  addonId: 'axolync-addon-songsense-capture-probe',
  addonVersion: '0.1.0',
});

function createActionContext(overrides = {}) {
  const addonLocalState = {};
  return {
    addonId: addonIdentity.addonId,
    addonVersion: addonIdentity.addonVersion,
    actionId: overrides.actionId ?? 'download_capture',
    async getAddonLocalState() {
      return addonLocalState;
    },
    async setAddonLocalStateValue(key, value) {
      addonLocalState[key] = value;
      return addonLocalState;
    },
    throwIfCancelled() {},
    ...overrides,
    addonLocalState,
  };
}

test.beforeEach(() => {
  resetCaptureSessionStoreForTests();
});

test('downloadCaptureAction returns an explicit no-capture outcome and persists an empty summary snapshot', async () => {
  const context = createActionContext();
  const result = await downloadCaptureAction({}, context);

  assert.equal(result.status, 'no-capture');
  assert.equal(context.addonLocalState[CAPTURE_SUMMARY_SNAPSHOT_STATE_KEY].hasCapture, false);
  assert.equal(context.addonLocalState[CAPTURE_LAST_DIAGNOSTIC_STATE_KEY].reason, 'no-capture');
  assert.equal(
    context.addonLocalState[ADDON_RUNTIME_DATA_SURFACES_STATE_KEY]?.[0]?.sections?.[0]?.facts?.find((fact) => fact.factId === 'summary_freshness')?.value,
    'action-boundary',
  );
});

test('downloadCaptureAction encodes and saves the retained capture when the host provides a save capability', async () => {
  replaceCaptureSessionWindow(addonIdentity, {
    audioPayload: {
      audioBuffer: new Float32Array([0.1, 0.2, 0.3, 0.4]),
      sampleRateHz: 44100,
      channels: 1,
    },
    chunkMeta: {
      bufferStartAudioMs: 0,
      captureEndAudioMs: 1000,
    },
    nowIso: '2026-04-11T10:00:00.000Z',
  });

  const saved = [];
  const context = createActionContext({
    async saveBytesAsDownload(fileName, mimeType, bytes) {
      saved.push({ fileName, mimeType, byteLength: bytes.length });
      return { uri: 'file:///capture.wav' };
    },
  });

  const result = await downloadCaptureAction({}, context);

  assert.equal(result.status, 'downloaded');
  assert.equal(saved.length, 1);
  assert.equal(saved[0].fileName, 'axolync-songsense-capture-probe.wav');
  assert.equal(saved[0].mimeType, 'audio/wav');
  assert.equal(saved[0].byteLength > 44, true);
  assert.equal(context.addonLocalState[CAPTURE_SUMMARY_SNAPSHOT_STATE_KEY].hasCapture, true);
  assert.equal(
    context.addonLocalState[ADDON_RUNTIME_DATA_SURFACES_STATE_KEY]?.[0]?.sections?.[0]?.facts?.find((fact) => fact.factId === 'duration_ms')?.value,
    '0 ms',
  );
  assert.equal(
    context.addonLocalState[ADDON_RUNTIME_DATA_SURFACES_STATE_KEY]?.[0]?.sections?.[0]?.facts?.find((fact) => fact.factId === 'sample_rate_hz')?.value,
    '44100 Hz',
  );
  assert.equal(
    context.addonLocalState[ADDON_RUNTIME_DATA_SURFACES_STATE_KEY]?.[0]?.sections?.[0]?.facts?.find((fact) => fact.factId === 'chunk_count')?.value,
    '1',
  );
});

test('downloadCaptureAction fails truthfully when the host save capability is missing', async () => {
  replaceCaptureSessionWindow(addonIdentity, {
    audioPayload: {
      audioBuffer: new Float32Array([0.1, 0.2, 0.3, 0.4]),
      sampleRateHz: 44100,
      channels: 1,
    },
    chunkMeta: {
      bufferStartAudioMs: 0,
      captureEndAudioMs: 1000,
    },
    nowIso: '2026-04-11T10:00:00.000Z',
  });

  const context = createActionContext();

  await assert.rejects(
    downloadCaptureAction({}, context),
    /saveBytesAsDownload/i,
  );
  assert.equal(context.addonLocalState[CAPTURE_LAST_DIAGNOSTIC_STATE_KEY].reason, 'missing-download-capability');
  assert.equal(
    context.addonLocalState[ADDON_RUNTIME_DATA_SURFACES_STATE_KEY]?.[0]?.sections?.[0]?.facts?.find((fact) => fact.factId === 'has_capture')?.value,
    'Yes',
  );
});

test('clearCaptureAction clears the retained capture and persists an empty summary snapshot', async () => {
  replaceCaptureSessionWindow(addonIdentity, {
    audioPayload: {
      audioBuffer: new Float32Array([0.1, 0.2, 0.3, 0.4]),
      sampleRateHz: 44100,
      channels: 1,
    },
    chunkMeta: {
      bufferStartAudioMs: 0,
      captureEndAudioMs: 1000,
    },
    nowIso: '2026-04-11T10:00:00.000Z',
  });

  const context = createActionContext({
    actionId: 'clear_capture',
  });
  const result = await clearCaptureAction({}, context);

  assert.equal(result.status, 'cleared');
  assert.equal(getCaptureSessionState(addonIdentity), null);
  assert.equal(context.addonLocalState[CAPTURE_SUMMARY_SNAPSHOT_STATE_KEY].hasCapture, false);
  assert.equal(context.addonLocalState[CAPTURE_LAST_DIAGNOSTIC_STATE_KEY].reason, 'cleared');
  assert.equal(
    context.addonLocalState[ADDON_RUNTIME_DATA_SURFACES_STATE_KEY]?.[0]?.sections?.[0]?.facts?.find((fact) => fact.factId === 'has_capture')?.value,
    'No',
  );
});
