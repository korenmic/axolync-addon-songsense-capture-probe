import { replaceCaptureSessionWindow } from '../../runtime/captureSessionStore.js';

const DEFAULT_ADDON_ID = 'axolync-addon-songsense-capture-probe';
const DEFAULT_ADDON_VERSION = '0.1.0';

function emitStage1Debug(input, entry) {
  const emitDebugLog = input?.__stage1AddonContext?.emitDebugLog;
  if (typeof emitDebugLog === 'function') {
    emitDebugLog(entry);
  }
}

function resolveAddonIdentity(input = {}) {
  return {
    addonId: String(input?.__stage1AddonContext?.addonId ?? DEFAULT_ADDON_ID),
    addonVersion: String(input?.__stage1AddonContext?.addonVersion ?? DEFAULT_ADDON_VERSION),
  };
}

export class CaptureProbeSongSenseAdapter {
  async query_song_candidates(input = {}) {
    const rawAudioBuffer = input?.audioPayload?.audioBuffer;
    if (!(rawAudioBuffer instanceof Float32Array) || rawAudioBuffer.length === 0) {
      emitStage1Debug(input, {
        level: 'info',
        message: '[axolync-addon-songsense-capture-probe] songsense skipped because no usable audio payload was provided.',
        payload: {
          reason: 'missing-audio-payload',
        },
      });
      return [];
    }

    try {
      const outcome = replaceCaptureSessionWindow(resolveAddonIdentity(input), {
        audioPayload: input.audioPayload,
        chunkMeta: input.chunkMeta,
      });
      const level = outcome.status === 'stale-window-suppressed' ? 'info' : 'info';
      emitStage1Debug(input, {
        level,
        message: `[axolync-addon-songsense-capture-probe] songsense ${outcome.status.replace(/-/g, ' ')}.`,
        payload: {
          reason: outcome.status,
          summary: outcome.summary,
        },
      });
    } catch (error) {
      emitStage1Debug(input, {
        level: 'warn',
        message: '[axolync-addon-songsense-capture-probe] songsense rejected the audio payload for capture.',
        payload: {
          reason: 'invalid-audio-payload',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
    return [];
  }
}
