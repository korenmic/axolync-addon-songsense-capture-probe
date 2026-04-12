import test from 'node:test';
import assert from 'node:assert/strict';

import { CaptureProbeSongSenseAdapter } from '../addon/adapters/CaptureProbeSongSenseAdapter/index.js';
import {
  getCaptureSessionState,
  resetCaptureSessionStoreForTests,
} from '../addon/runtime/captureSessionStore.js';

const addonContext = Object.freeze({
  addonId: 'axolync-addon-songsense-capture-probe',
  addonVersion: '0.1.0',
});

function createLogCollector() {
  const entries = [];
  return {
    entries,
    context: {
      ...addonContext,
      emitDebugLog(entry) {
        entries.push(entry);
      },
    },
  };
}

function createAudioPayload(samples, sampleRateHz = 44100, channels = 1) {
  return {
    audioBuffer: new Float32Array(samples),
    sampleRateHz,
    channels,
  };
}

test.beforeEach(() => {
  resetCaptureSessionStoreForTests();
});

test('the capture-probe adapter stores a newer host window and still returns no candidates', async () => {
  const logs = createLogCollector();
  const adapter = new CaptureProbeSongSenseAdapter();

  const result = await adapter.query_song_candidates({
    audioPayload: createAudioPayload([0.1, 0.2, 0.3, 0.4]),
    chunkMeta: {
      bufferStartAudioMs: 0,
      captureEndAudioMs: 1000,
    },
    __stage1AddonContext: logs.context,
  });

  assert.deepEqual(result, []);
  assert.equal(logs.entries.length, 1);
  assert.equal(logs.entries[0]?.payload?.reason, 'stored-initial-window');
  assert.equal(getCaptureSessionState(addonContext)?.captureEndAudioMs, 1000);
});

test('the capture-probe adapter suppresses stale host windows instead of appending them', async () => {
  const logs = createLogCollector();
  const adapter = new CaptureProbeSongSenseAdapter();

  await adapter.query_song_candidates({
    audioPayload: createAudioPayload([0.1, 0.2, 0.3, 0.4]),
    chunkMeta: {
      bufferStartAudioMs: 0,
      captureEndAudioMs: 1000,
    },
    __stage1AddonContext: logs.context,
  });
  await adapter.query_song_candidates({
    audioPayload: createAudioPayload([0.9, 1.0]),
    chunkMeta: {
      bufferStartAudioMs: 500,
      captureEndAudioMs: 1000,
    },
    __stage1AddonContext: logs.context,
  });

  assert.equal(logs.entries.at(-1)?.payload?.reason, 'stale-window-suppressed');
  assert.deepEqual(
    Array.from(getCaptureSessionState(addonContext).audioBuffer),
    Array.from(new Float32Array([0.1, 0.2, 0.3, 0.4])),
  );
});

test('the capture-probe adapter logs a shape reset when a newer capture changes sample rate', async () => {
  const logs = createLogCollector();
  const adapter = new CaptureProbeSongSenseAdapter();

  await adapter.query_song_candidates({
    audioPayload: createAudioPayload([0.1, 0.2, 0.3, 0.4], 44100, 1),
    chunkMeta: {
      bufferStartAudioMs: 0,
      captureEndAudioMs: 1000,
    },
    __stage1AddonContext: logs.context,
  });
  await adapter.query_song_candidates({
    audioPayload: createAudioPayload([0.1, 0.2, 0.3, 0.4], 48000, 1),
    chunkMeta: {
      bufferStartAudioMs: 1000,
      captureEndAudioMs: 2000,
    },
    __stage1AddonContext: logs.context,
  });

  assert.equal(logs.entries.at(-1)?.payload?.reason, 'shape-reset');
  assert.equal(getCaptureSessionState(addonContext)?.sampleRateHz, 48000);
});

test('the capture-probe adapter skips missing audio payloads and never emits placeholder detections', async () => {
  const logs = createLogCollector();
  const adapter = new CaptureProbeSongSenseAdapter();

  const result = await adapter.query_song_candidates({
    __stage1AddonContext: logs.context,
  });

  assert.deepEqual(result, []);
  assert.equal(logs.entries[0]?.payload?.reason, 'missing-audio-payload');
  assert.equal(getCaptureSessionState(addonContext), null);
});
