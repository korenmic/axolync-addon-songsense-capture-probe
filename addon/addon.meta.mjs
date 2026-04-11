import captureProbeSongSenseAdapter from './adapters/CaptureProbeSongSenseAdapter/adapter.meta.mjs';
import { downloadCaptureAction } from './actions/downloadCaptureAction.js';
import { clearCaptureAction } from './actions/clearCaptureAction.js';

const captureSummarySurface = Object.freeze({
  surfaceId: 'capture_summary',
  label: 'Capture Summary',
  sections: Object.freeze([
    Object.freeze({
      sectionId: 'summary',
      label: 'Current Capture',
      kind: 'facts',
      facts: Object.freeze([
        Object.freeze({
          factId: 'has_capture',
          label: 'Has capture',
          value: 'No',
        }),
        Object.freeze({
          factId: 'duration_ms',
          label: 'Duration',
          value: '0 ms',
        }),
        Object.freeze({
          factId: 'sample_rate_hz',
          label: 'Sample rate',
          value: 'n/a',
        }),
        Object.freeze({
          factId: 'channels',
          label: 'Channels',
          value: 'n/a',
        }),
        Object.freeze({
          factId: 'chunk_count',
          label: 'Chunk count',
          value: '0',
        }),
        Object.freeze({
          factId: 'summary_freshness',
          label: 'Summary freshness',
          value: 'action-boundary',
        }),
      ]),
    }),
  ]),
});

export default Object.freeze({
  addonId: 'axolync-addon-songsense-capture-probe',
  name: 'Axolync SongSense Capture Probe Addon',
  version: '0.1.0',
  contractsVersion: '1.4.0',
  description: 'Diagnostic-only Stage 1 addon that captures the latest authoritative SongSense host window for export and never performs recognition.',
  requirements: Object.freeze([]),
  addonSettings: Object.freeze([]),
  addonActions: Object.freeze([
    Object.freeze({
      actionId: 'download_capture',
      label: 'Download Capture',
      description: 'Encode the current retained capture as a WAV artifact and hand it to the generic host download seam.',
      category: 'export',
      destructive: false,
      cancellable: false,
      progressCapable: false,
      confirmationRequired: false,
      handler: downloadCaptureAction,
      sourceFileUrl: new URL('./actions/downloadCaptureAction.js', import.meta.url),
      bundlePath: 'actions/download-capture.js',
    }),
    Object.freeze({
      actionId: 'clear_capture',
      label: 'Clear Capture',
      description: 'Clear the current session-scoped capture so the next probe starts from a known empty state.',
      category: 'maintenance',
      destructive: true,
      cancellable: false,
      progressCapable: false,
      confirmationRequired: true,
      handler: clearCaptureAction,
      sourceFileUrl: new URL('./actions/clearCaptureAction.js', import.meta.url),
      bundlePath: 'actions/clear-capture.js',
    }),
  ]),
  addonRuntimeDataSurfaces: Object.freeze([
    captureSummarySurface,
  ]),
  adapters: Object.freeze([
    captureProbeSongSenseAdapter,
  ]),
});
