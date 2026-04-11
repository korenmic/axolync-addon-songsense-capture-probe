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

function formatCaptureValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') {
    return 'n/a';
  }
  return `${value}${suffix}`;
}

export function buildCaptureSummaryRuntimeSurfaces(summary = buildCaptureSummarySnapshot(null)) {
  return [
    {
      surfaceId: 'capture_summary',
      label: 'Capture Summary',
      sections: [
        {
          sectionId: 'summary',
          label: 'Current Capture',
          kind: 'facts',
          facts: [
            {
              factId: 'has_capture',
              label: 'Has capture',
              value: summary.hasCapture ? 'Yes' : 'No',
            },
            {
              factId: 'duration_ms',
              label: 'Duration',
              value: `${summary.durationMs} ms`,
            },
            {
              factId: 'sample_rate_hz',
              label: 'Sample rate',
              value: formatCaptureValue(summary.sampleRateHz, ' Hz'),
            },
            {
              factId: 'channels',
              label: 'Channels',
              value: formatCaptureValue(summary.channels),
            },
            {
              factId: 'chunk_count',
              label: 'Chunk count',
              value: String(summary.chunkCount),
            },
            {
              factId: 'summary_freshness',
              label: 'Summary freshness',
              value: summary.summaryFreshness,
            },
          ],
        },
      ],
    },
  ];
}

export async function persistCaptureSummarySnapshot(context, captureState) {
  const summary = buildCaptureSummarySnapshot(captureState);
  await context.setAddonLocalStateValue(CAPTURE_SUMMARY_SNAPSHOT_STATE_KEY, summary);
  await context.setAddonLocalStateValue(
    ADDON_RUNTIME_DATA_SURFACES_STATE_KEY,
    buildCaptureSummaryRuntimeSurfaces(summary),
  );
  return summary;
}

export async function persistCaptureActionDiagnostic(context, diagnostic) {
  await context.setAddonLocalStateValue(CAPTURE_LAST_DIAGNOSTIC_STATE_KEY, diagnostic);
  return diagnostic;
}
