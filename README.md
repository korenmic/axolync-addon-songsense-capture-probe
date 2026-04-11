# Axolync SongSense Capture Probe Addon

`axolync-addon-songsense-capture-probe` is a diagnostic Stage 1 addon repo for a SongSense capture-probe adapter.

Current shipped truth:
- one local-js SongSense adapter: `CaptureProbeSongSenseAdapter`
- two addon actions:
  - `download_capture`
  - `clear_capture`
- one addon-global typed runtime data surface:
  - `capture_summary`
- package scaffolding through `npm run package`
- tracked report manifest snapshot through `npm run report:manifest`
- repo-local validation through `npm test`

Current behavior scope:
- the adapter intentionally returns no candidates
- query-time input retains only the latest authoritative host window instead of appending overlapping audio
- `download_capture` exports the current retained window as a deterministic WAV PCM16 file through the generic addon-action download/save host seam
- `clear_capture` removes the current retained session capture and resets the visible summary back to empty
- the typed runtime surface exposes action-boundary summary truth only; it does not promise live query-time mutation
- retained raw audio stays session-scoped inside the current hosted-web same-realm Stage 1 host model

The finished addon is meant to:
- consume the real Axolync SongSense audio capture path
- never emit a song detection
- keep a bounded capture buffer for debugging
- expose addon actions to download or clear the captured audio

Manual usage:
1. Install the packaged addon in Axolync and select it as the active SongSense addon.
2. Let Axolync feed a real SongSense capture window into the probe.
3. Use `Download Capture` from the Addons route to save the retained WAV artifact.
4. Use `Clear Capture` to reset the probe before the next manual reproduction.

The exported artifact will let us isolate whether failures come from:
- Axolync audio capture and delivery
- the adapter wrapper lane
- or the downstream recognizer lane such as Vibra/Shazam lookup
