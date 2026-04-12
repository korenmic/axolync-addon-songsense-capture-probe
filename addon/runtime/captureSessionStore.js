const CAPTURE_SESSION_STORE_SYMBOL = Symbol.for('axolync-addon-songsense-capture-probe.capture-session-store');

function ensureAddonIdentity(identity = {}) {
  const addonId = String(identity.addonId ?? '').trim();
  const addonVersion = String(identity.addonVersion ?? '').trim();
  if (!addonId || !addonVersion) {
    throw new Error('Capture session store requires addonId and addonVersion.');
  }
  return {
    addonId,
    addonVersion,
    key: `${addonId}@${addonVersion}`,
  };
}

function getRegistry() {
  if (!(globalThis[CAPTURE_SESSION_STORE_SYMBOL] instanceof Map)) {
    globalThis[CAPTURE_SESSION_STORE_SYMBOL] = new Map();
  }
  return globalThis[CAPTURE_SESSION_STORE_SYMBOL];
}

function summarizeCaptureState(state) {
  if (!state) {
    return {
      hasCapture: false,
      sampleRateHz: null,
      channels: null,
      chunkCount: 0,
      totalSampleCount: 0,
      captureEndAudioMs: null,
      bufferStartAudioMs: null,
      updatedAtIso: null,
    };
  }
  return {
    hasCapture: true,
    sampleRateHz: state.sampleRateHz,
    channels: state.channels,
    chunkCount: state.chunkCount,
    totalSampleCount: state.totalSampleCount,
    captureEndAudioMs: state.captureEndAudioMs,
    bufferStartAudioMs: state.bufferStartAudioMs,
    updatedAtIso: state.updatedAtIso,
  };
}

function normalizeAudioPayload(audioPayload = {}) {
  const audioBuffer = audioPayload.audioBuffer;
  if (!(audioBuffer instanceof Float32Array) || audioBuffer.length === 0) {
    throw new Error('Capture session store requires a non-empty Float32Array audio buffer.');
  }
  const sampleRateHz = Math.round(Number(audioPayload.sampleRateHz));
  const channels = Math.round(Number(audioPayload.channels ?? 1));
  if (!Number.isFinite(sampleRateHz) || sampleRateHz <= 0) {
    throw new Error('Capture session store requires a positive sample rate.');
  }
  if (!Number.isFinite(channels) || channels <= 0) {
    throw new Error('Capture session store requires a positive channel count.');
  }
  if (audioBuffer.length < channels || audioBuffer.length % channels !== 0) {
    throw new Error('Capture session store requires an interleaved buffer that matches the declared channel count.');
  }
  return {
    audioBuffer,
    sampleRateHz,
    channels,
  };
}

function normalizeChunkMeta(chunkMeta = {}) {
  const captureEndAudioMs = Number(chunkMeta.captureEndAudioMs);
  const bufferStartAudioMs = Number(chunkMeta.bufferStartAudioMs);
  return {
    captureEndAudioMs: Number.isFinite(captureEndAudioMs) ? captureEndAudioMs : null,
    bufferStartAudioMs: Number.isFinite(bufferStartAudioMs) ? bufferStartAudioMs : null,
  };
}

export function getCaptureSessionState(identity = {}) {
  const { key } = ensureAddonIdentity(identity);
  return getRegistry().get(key) ?? null;
}

export function clearCaptureSessionState(identity = {}) {
  const normalizedIdentity = ensureAddonIdentity(identity);
  const registry = getRegistry();
  const hadState = registry.delete(normalizedIdentity.key);
  return {
    status: hadState ? 'cleared' : 'already-empty',
    summary: summarizeCaptureState(null),
  };
}

export function replaceCaptureSessionWindow(identity = {}, input = {}) {
  const normalizedIdentity = ensureAddonIdentity(identity);
  const audioPayload = normalizeAudioPayload(input.audioPayload);
  const chunkMeta = normalizeChunkMeta(input.chunkMeta);
  const registry = getRegistry();
  const previous = registry.get(normalizedIdentity.key) ?? null;

  if (
    previous
    && Number.isFinite(previous.captureEndAudioMs)
    && Number.isFinite(chunkMeta.captureEndAudioMs)
    && chunkMeta.captureEndAudioMs <= previous.captureEndAudioMs
  ) {
    return {
      status: 'stale-window-suppressed',
      state: previous,
      summary: summarizeCaptureState(previous),
    };
  }

  const shapeChanged = previous
    ? previous.sampleRateHz !== audioPayload.sampleRateHz || previous.channels !== audioPayload.channels
    : false;
  const nextState = {
    audioBuffer: audioPayload.audioBuffer,
    sampleRateHz: audioPayload.sampleRateHz,
    channels: audioPayload.channels,
    chunkCount: shapeChanged || !previous ? 1 : previous.chunkCount + 1,
    totalSampleCount: audioPayload.audioBuffer.length,
    captureEndAudioMs: chunkMeta.captureEndAudioMs,
    bufferStartAudioMs: chunkMeta.bufferStartAudioMs,
    updatedAtIso: typeof input.nowIso === 'string' && input.nowIso.trim().length > 0
      ? input.nowIso
      : new Date().toISOString(),
  };
  registry.set(normalizedIdentity.key, nextState);

  return {
    status: shapeChanged
      ? 'shape-reset'
      : previous
        ? 'replaced-with-newer-window'
        : 'stored-initial-window',
    state: nextState,
    summary: summarizeCaptureState(nextState),
  };
}

export function resetCaptureSessionStoreForTests() {
  getRegistry().clear();
}
