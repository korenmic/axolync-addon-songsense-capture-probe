import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearCaptureSessionState,
  getCaptureSessionState,
  replaceCaptureSessionWindow,
  resetCaptureSessionStoreForTests,
} from '../addon/runtime/captureSessionStore.js';

const addonIdentity = Object.freeze({
  addonId: 'axolync-addon-songsense-capture-probe',
  addonVersion: '0.1.0',
});

function createAudioPayload(samples, sampleRateHz = 44100, channels = 1) {
  return {
    audioPayload: {
      audioBuffer: new Float32Array(samples),
      sampleRateHz,
      channels,
    },
  };
}

test.beforeEach(() => {
  resetCaptureSessionStoreForTests();
});

test('replaceCaptureSessionWindow stores the first window and replaces it when a newer authoritative host window arrives', () => {
  const first = replaceCaptureSessionWindow(addonIdentity, {
    ...createAudioPayload([0.1, 0.2, 0.3, 0.4]),
    chunkMeta: {
      bufferStartAudioMs: 0,
      captureEndAudioMs: 1000,
    },
    nowIso: '2026-04-11T10:00:00.000Z',
  });
  const second = replaceCaptureSessionWindow(addonIdentity, {
    ...createAudioPayload([0.5, 0.6, 0.7, 0.8]),
    chunkMeta: {
      bufferStartAudioMs: 500,
      captureEndAudioMs: 1500,
    },
    nowIso: '2026-04-11T10:00:01.000Z',
  });

  assert.equal(first.status, 'stored-initial-window');
  assert.equal(first.summary.chunkCount, 1);
  assert.equal(second.status, 'replaced-with-newer-window');
  assert.equal(second.summary.chunkCount, 2);
  assert.equal(second.summary.captureEndAudioMs, 1500);
  assert.deepEqual(
    Array.from(getCaptureSessionState(addonIdentity).audioBuffer),
    Array.from(new Float32Array([0.5, 0.6, 0.7, 0.8])),
  );
});

test('replaceCaptureSessionWindow suppresses stale or non-advancing host windows', () => {
  replaceCaptureSessionWindow(addonIdentity, {
    ...createAudioPayload([0.1, 0.2, 0.3, 0.4]),
    chunkMeta: {
      bufferStartAudioMs: 0,
      captureEndAudioMs: 2000,
    },
  });

  const stale = replaceCaptureSessionWindow(addonIdentity, {
    ...createAudioPayload([0.9, 1.0]),
    chunkMeta: {
      bufferStartAudioMs: 1000,
      captureEndAudioMs: 2000,
    },
  });

  assert.equal(stale.status, 'stale-window-suppressed');
  assert.equal(stale.summary.captureEndAudioMs, 2000);
  assert.deepEqual(
    Array.from(getCaptureSessionState(addonIdentity).audioBuffer),
    Array.from(new Float32Array([0.1, 0.2, 0.3, 0.4])),
  );
});

test('replaceCaptureSessionWindow resets chunk counting when the capture shape changes', () => {
  replaceCaptureSessionWindow(addonIdentity, {
    ...createAudioPayload([0.1, 0.2, 0.3, 0.4], 44100, 1),
    chunkMeta: {
      bufferStartAudioMs: 0,
      captureEndAudioMs: 1000,
    },
  });

  const reset = replaceCaptureSessionWindow(addonIdentity, {
    ...createAudioPayload([0.1, 0.2, 0.3, 0.4], 48000, 1),
    chunkMeta: {
      bufferStartAudioMs: 1000,
      captureEndAudioMs: 2000,
    },
  });

  assert.equal(reset.status, 'shape-reset');
  assert.equal(reset.summary.sampleRateHz, 48000);
  assert.equal(reset.summary.chunkCount, 1);
});

test('clearCaptureSessionState removes the retained session capture and reports an empty summary', () => {
  replaceCaptureSessionWindow(addonIdentity, {
    ...createAudioPayload([0.1, 0.2, 0.3, 0.4]),
    chunkMeta: {
      bufferStartAudioMs: 0,
      captureEndAudioMs: 1000,
    },
  });

  const cleared = clearCaptureSessionState(addonIdentity);

  assert.equal(cleared.status, 'cleared');
  assert.equal(cleared.summary.hasCapture, false);
  assert.equal(getCaptureSessionState(addonIdentity), null);
});
