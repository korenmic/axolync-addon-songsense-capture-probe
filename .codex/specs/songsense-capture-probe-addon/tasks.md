# Implementation Plan

- [ ] 1. Scaffold the capture-probe addon metadata and repo-owned diagnostic truth
  - Add addon metadata for one Stage 1 local-js SongSense adapter, two addon actions (`download_capture`, `clear_capture`), and one lightweight capture-summary runtime surface.
  - Keep the repo/package/report descriptions explicit that this addon is diagnostic-only and never performs recognition.
  - _Requirements: 2.1, 2.2, 7.1_

- [ ] 2. Implement the bounded addon-owned session capture store
  - Add a shared addon-owned runtime module that keeps the current bounded capture in session memory, keyed safely for the addon instance.
  - Keep binary capture bytes out of primitive addon-global settings and expose only lightweight summary metadata separately.
  - Add tests for append, trim, shape-reset, and clear behavior.
  - _Requirements: 1.1, 1.3, 4.1, 4.2, 5.1, 5.2_

- [ ] 3. Implement the SongSense probe adapter that captures but never detects
  - Consume the real SongSense query payload, append usable audio into the bounded capture store, and always return zero candidates.
  - Emit structured diagnostics for append, skip, trim, and reset outcomes.
  - Add tests proving the adapter never emits placeholder detections.
  - _Requirements: 1.1, 1.2, 1.4, 6.1_

- [ ] 4. Implement a deterministic WAV export path for the current capture
  - Add an addon-local WAV PCM16 encoder that turns the current bounded capture into a standard downloadable artifact.
  - Add tests for header correctness, duration math, and deterministic byte output from known input.
  - _Requirements: 3.1, 3.3_

- [ ] 5. Implement addon actions for `download_capture` and `clear_capture`
  - Add action handlers that read the current capture, fail truthfully when it is absent, download the encoded WAV, and clear the bounded session capture when requested.
  - Keep outcomes and logs explicit for no-capture, success, and failure paths.
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 6.2, 6.3_

- [ ] 6. Surface lightweight capture summary through the addon-global runtime surface
  - Expose semantic capture facts such as existence, duration, sample rate, channels, and chunk count without surfacing raw bytes.
  - Add tests proving the summary updates after capture growth and after clear.
  - _Requirements: 2.1, 2.2, 2.3, 4.2_

- [ ] 7. Extend the generic browser addon-action host seam with download/save support
  - Add one generic host capability that addon actions can use to save downloadable bytes without importing browser internals.
  - Wire the generic addon action runner and UI flow so packaged addon actions can trigger that capability truthfully.
  - Add browser-side tests proving missing capability fails honestly and present capability triggers the download path.
  - _Requirements: 3.4, 5.1, 7.2, 7.3_

- [ ] 8. Align package, report, and repo-facing docs with the real diagnostic behavior
  - Keep addon/package/report truth aligned around “capture and export, never detect.”
  - Document the first implementation's scope truthfully, especially whether raw capture is session-scoped only.
  - Add packaging/report checks that keep those surfaces aligned.
  - _Requirements: 5.3, 7.1, 7.2_
