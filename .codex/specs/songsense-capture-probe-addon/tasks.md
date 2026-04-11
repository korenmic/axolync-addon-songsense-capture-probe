# Implementation Plan

- [x] 1. Scaffold the capture-probe addon metadata and repo-owned diagnostic truth
  - Add addon metadata for one Stage 1 local-js SongSense adapter, two addon actions (`download_capture`, `clear_capture`), and one lightweight capture-summary runtime surface.
  - Keep the repo/package/report descriptions explicit that this addon is diagnostic-only, never performs recognition, and exposes action-boundary capture summary truth rather than live query-time surface mutation.
  - _Requirements: 2.1, 2.2, 7.1, 7.4_

- [ ] 2. Implement the explicit hosted-web session capture store and latest-window policy
  - Add a symbol-keyed `globalThis` runtime module that keeps the current retained capture in session memory, keyed safely for addon identity on the current hosted-web Stage 1 host.
  - Keep binary capture bytes out of primitive addon-global settings and encode the policy as latest-authoritative-host-window only, with stale-window suppression instead of overlapping append behavior.
  - Add tests for replace-with-newer-window, stale-window suppression, shape-reset, and clear behavior.
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3_

- [ ] 3. Implement the SongSense probe adapter that captures but never detects
  - Consume the real SongSense query payload, compare incoming audio-time metadata, replace the retained capture only when the host window is newer, and always return zero candidates.
  - Emit structured diagnostics for replace, stale-window suppression, skip, and reset outcomes.
  - Add tests proving the adapter never emits placeholder detections.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2_

- [ ] 4. Implement a deterministic WAV export path for the current capture
  - Add an addon-local WAV PCM16 encoder that turns the current bounded capture into a standard downloadable artifact.
  - Add tests for header correctness, duration math, and deterministic byte output from known input.
  - _Requirements: 3.1, 3.3_

- [ ] 5. Implement addon actions for `download_capture` and `clear_capture`
  - Add action handlers that read the current capture from the explicit session store, fail truthfully when it is absent, download the encoded WAV, clear the session capture when requested, and persist an action-boundary summary snapshot.
  - Keep outcomes and logs explicit for no-capture, success, and failure paths.
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 5.1, 6.3, 6.4_

- [ ] 6. Surface lightweight action-boundary capture summary through the addon-global runtime surface
  - Expose semantic capture facts such as existence, duration, sample rate, channels, and chunk count without surfacing raw bytes.
  - Keep the visible summary explicitly action-boundary only, written by addon actions rather than by query-time mutation hooks that do not exist yet.
  - Add tests proving the summary updates after download and after clear, and stays honest about its action-boundary freshness.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.2_

- [ ] 7. Extend the generic browser addon-action host seam with download/save support
  - Add one generic host capability that addon actions can use to save downloadable bytes without importing browser internals.
  - Wire the generic addon action runner and UI flow so packaged addon actions can trigger that capability truthfully, without also pretending query-time runtime can mutate addon-local runtime-surface state.
  - Add browser-side tests proving missing capability fails honestly and present capability triggers the download path.
  - _Requirements: 3.4, 7.2, 7.3, 7.4_

- [ ] 8. Align package, report, and repo-facing docs with the real diagnostic behavior
  - Keep addon/package/report truth aligned around “retain the latest host window, export it, never detect.”
  - Document the first implementation's scope truthfully, especially that raw capture is session-scoped only, sharing is hosted-web same-realm only, and visible summary is action-boundary truth rather than live query-time mutation.
  - Add packaging/report checks that keep those surfaces aligned.
  - _Requirements: 5.2, 5.3, 5.4, 7.1, 7.2, 7.4_
