import { CaptureProbeSongSenseAdapter } from './index.js';

export default Object.freeze({
  adapterId: 'CaptureProbeSongSenseAdapter',
  label: 'SongSense Capture Probe Adapter',
  description: 'Diagnostic-only SongSense adapter that observes the real host audio window, keeps capture truth inside addon-owned scope, and intentionally never emits detections.',
  runtimeCodeState: 'partial',
  shippableInRelease: false,
  shippableInDebug: true,
  hiddenInUi: false,
  notes: 'Session-scoped hosted-web same-realm diagnostic probe. Export depends on a generic addon action download/save host capability and the visible summary is action-boundary truth only.',
  hostMode: 'local-js',
  supportedPlatforms: Object.freeze(['web', 'android', 'desktop']),
  requiredPermissions: Object.freeze([]),
  requiredHostCapabilities: Object.freeze(['addon-action-download-save']),
  gatingSettings: Object.freeze([]),
  settings: Object.freeze([]),
  implementation: CaptureProbeSongSenseAdapter,
  bundlePath: 'adapters/CaptureProbeSongSenseAdapter/index.js',
  sourceFileUrl: new URL('./index.js', import.meta.url),
  queryMethods: Object.freeze({
    songsense: Object.freeze({
      query_song_candidates: CaptureProbeSongSenseAdapter.prototype.query_song_candidates,
    }),
  }),
});
