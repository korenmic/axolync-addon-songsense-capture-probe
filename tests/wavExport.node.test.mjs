import test from 'node:test';
import assert from 'node:assert/strict';

import { encodeCaptureAsWav } from '../addon/runtime/wavExport.js';

test('encodeCaptureAsWav writes a valid PCM16 RIFF/WAVE header', () => {
  const result = encodeCaptureAsWav({
    audioBuffer: new Float32Array([0, 0.5, -0.5, 1]),
    sampleRateHz: 8000,
    channels: 1,
  });
  const view = new DataView(result.bytes.buffer, result.bytes.byteOffset, result.bytes.byteLength);

  assert.equal(String.fromCharCode(...result.bytes.slice(0, 4)), 'RIFF');
  assert.equal(String.fromCharCode(...result.bytes.slice(8, 12)), 'WAVE');
  assert.equal(String.fromCharCode(...result.bytes.slice(12, 16)), 'fmt ');
  assert.equal(String.fromCharCode(...result.bytes.slice(36, 40)), 'data');
  assert.equal(view.getUint16(20, true), 1);
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(24, true), 8000);
  assert.equal(view.getUint16(34, true), 16);
  assert.equal(view.getUint32(40, true), 8);
});

test('encodeCaptureAsWav reports duration from frame count and sample rate', () => {
  const result = encodeCaptureAsWav({
    audioBuffer: new Float32Array(16000),
    sampleRateHz: 8000,
    channels: 2,
  });

  assert.equal(result.durationMs, 1000);
  assert.equal(result.channels, 2);
  assert.equal(result.sampleRateHz, 8000);
});

test('encodeCaptureAsWav produces deterministic bytes for the same input', () => {
  const input = {
    audioBuffer: new Float32Array([0.25, -0.25, 0.75, -0.75]),
    sampleRateHz: 44100,
    channels: 1,
  };

  const first = encodeCaptureAsWav(input);
  const second = encodeCaptureAsWav(input);

  assert.equal(first.fileName, 'axolync-songsense-capture-probe.wav');
  assert.equal(first.mimeType, 'audio/wav');
  assert.deepEqual(Array.from(first.bytes), Array.from(second.bytes));
});
