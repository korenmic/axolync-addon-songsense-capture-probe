# Axolync SongSense Capture Probe Addon

`axolync-addon-songsense-capture-probe` is a diagnostic Stage 1 addon repo for a SongSense capture-probe adapter.

Current scaffolded truth:
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
- the scaffolded adapter intentionally returns no candidates
- action handlers are still placeholders until the capture store, WAV export, and host download seam tasks land
- the typed runtime surface currently declares the empty diagnostic summary truth that later action-boundary updates will own

The finished addon is meant to:
- consume the real Axolync SongSense audio capture path
- never emit a song detection
- keep a bounded capture buffer for debugging
- expose addon actions to download or clear the captured audio

The exported artifact will let us isolate whether failures come from:
- Axolync audio capture and delivery
- the adapter wrapper lane
- or the downstream recognizer lane such as Vibra/Shazam lookup
