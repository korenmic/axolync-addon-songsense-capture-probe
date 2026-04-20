import captureProbeSongSenseAdapter from './adapters/CaptureProbeSongSenseAdapter/adapter.meta.mjs';
import { downloadCaptureAction } from './actions/downloadCaptureAction.js';
import { clearCaptureAction } from './actions/clearCaptureAction.js';
import { buildCaptureSummaryRuntimeSurfaces } from './runtime/captureSummaryState.js';

export default Object.freeze({
  addonId: 'axolync-addon-songsense-capture-probe',
  name: 'Axolync SongSense Capture Probe Addon',
  version: '0.1.0',
  contractsVersion: '2.0.0',
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
    Object.freeze(buildCaptureSummaryRuntimeSurfaces()[0]),
  ]),
  adapters: Object.freeze([
    captureProbeSongSenseAdapter,
  ]),
});
