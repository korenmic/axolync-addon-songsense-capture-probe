const DEFAULT_CAPTURE_FILE_NAME = 'axolync-songsense-capture-probe.wav';

function clampFloatSample(value) {
  if (!Number.isFinite(value)) return 0;
  if (value > 1) return 1;
  if (value < -1) return -1;
  return value;
}

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

export function encodeCaptureAsWav(input = {}) {
  const audioBuffer = input.audioBuffer;
  if (!(audioBuffer instanceof Float32Array) || audioBuffer.length === 0) {
    throw new Error('WAV export requires a non-empty Float32Array audio buffer.');
  }

  const sampleRateHz = Math.round(Number(input.sampleRateHz));
  const channels = Math.round(Number(input.channels ?? 1));
  if (!Number.isFinite(sampleRateHz) || sampleRateHz <= 0) {
    throw new Error('WAV export requires a positive sample rate.');
  }
  if (!Number.isFinite(channels) || channels <= 0) {
    throw new Error('WAV export requires a positive channel count.');
  }
  if (audioBuffer.length % channels !== 0) {
    throw new Error('WAV export requires an interleaved audio buffer that matches the declared channel count.');
  }

  const frameCount = audioBuffer.length / channels;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRateHz * blockAlign;
  const dataChunkSize = audioBuffer.length * bytesPerSample;
  const totalSize = 44 + dataChunkSize;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRateHz, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataChunkSize, true);

  let writeOffset = 44;
  for (let index = 0; index < audioBuffer.length; index += 1) {
    const sample = clampFloatSample(audioBuffer[index]);
    const pcm16 = sample < 0
      ? Math.round(sample * 0x8000)
      : Math.round(sample * 0x7fff);
    view.setInt16(writeOffset, pcm16, true);
    writeOffset += bytesPerSample;
  }

  return {
    fileName: String(input.fileName ?? DEFAULT_CAPTURE_FILE_NAME),
    mimeType: 'audio/wav',
    bytes: new Uint8Array(buffer),
    durationMs: Math.round((frameCount / sampleRateHz) * 1000),
    sampleRateHz,
    channels,
  };
}
