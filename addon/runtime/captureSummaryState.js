export const CAPTURE_SUMMARY_SNAPSHOT_STATE_KEY = 'captureSummarySnapshot';
export const CAPTURE_LAST_DIAGNOSTIC_STATE_KEY = 'captureLastDiagnostic';
export const ADDON_RUNTIME_DATA_SURFACES_STATE_KEY = 'addonRuntimeDataSurfaces';

export function buildCaptureSummarySnapshot(captureState) {
  if (!captureState) {
    return {
      hasCapture: false,
      durationMs: 0,
      sampleRateHz: null,
      channels: null,
      chunkCount: 0,
      updatedAtIso: null,
      captureEndAudioMs: null,
      summaryFreshness: 'action-boundary',
    };
  }
  const frameCount = captureState.totalSampleCount / captureState.channels;
  return {
    hasCapture: true,
    durationMs: Math.round((frameCount / captureState.sampleRateHz) * 1000),
    sampleRateHz: captureState.sampleRateHz,
    channels: captureState.channels,
    chunkCount: captureState.chunkCount,
    updatedAtIso: captureState.updatedAtIso,
    captureEndAudioMs: captureState.captureEndAudioMs,
    summaryFreshness: 'action-boundary',
  };
}

export async function persistCaptureSummarySnapshot(context, captureState) {
  const summary = buildCaptureSummarySnapshot(captureState);
  await context.setAddonLocalStateValue(CAPTURE_SUMMARY_SNAPSHOT_STATE_KEY, summary);
  return summary;
}

export async function persistCaptureActionDiagnostic(context, diagnostic) {
  await context.setAddonLocalStateValue(CAPTURE_LAST_DIAGNOSTIC_STATE_KEY, diagnostic);
  return diagnostic;
}
