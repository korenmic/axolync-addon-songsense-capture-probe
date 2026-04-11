# Requirements Document

## Introduction

`axolync-addon-songsense-capture-probe` is a testing-only Stage 1 SongSense addon that exercises the real Axolync audio-capture path without performing recognition. Instead of returning candidates, it accumulates a bounded recent capture and exposes addon actions that let the operator download or clear that capture. The exported file becomes a manual source-of-truth artifact for isolating whether future failures come from Axolync capture, an adapter wrapper, or a downstream recognizer.

## Requirements

### Requirement 1

**User Story:** As a debugger, I want a real SongSense addon that captures the same audio Axolync sends to a detector, so that I can inspect the host-delivered audio independently of any recognizer.

#### Acceptance Criteria

1. WHEN `query_song_candidates` receives a usable SongSense audio payload THEN the system SHALL append that payload into a bounded recent-capture buffer owned by the addon.
2. WHEN `query_song_candidates` receives no usable SongSense audio payload THEN the system SHALL leave the capture buffer unchanged and SHALL return zero candidates.
3. WHEN the capture buffer grows beyond the configured diagnostic window THEN the system SHALL trim older audio deterministically and SHALL retain the most recent bounded window only.
4. WHEN the probe adapter processes any query THEN the system SHALL return zero SongSense candidates and SHALL NOT emit placeholder or fake detections.

### Requirement 2

**User Story:** As a debugger, I want the probe addon to expose lightweight capture state, so that I can see whether a meaningful sample exists before exporting it.

#### Acceptance Criteria

1. WHEN capture state changes THEN the system SHALL expose a lightweight addon-global capture summary that includes whether capture exists, duration, sample rate, channel count, and chunk count.
2. WHEN no capture exists THEN the system SHALL expose an explicit empty-state summary rather than stale prior values.
3. WHEN the addon-global runtime surface is rendered THEN the system SHALL surface semantic capture metadata only and SHALL NOT expose raw audio bytes in the normal settings surface.

### Requirement 3

**User Story:** As a debugger, I want a deliberate addon action that downloads the current capture as a standard audio file, so that I can test the exported artifact in external tools such as Shazam on Android.

#### Acceptance Criteria

1. WHEN the operator runs `Download Capture` and a capture exists THEN the system SHALL export the current bounded capture as a deterministic standard audio file.
2. WHEN the operator runs `Download Capture` and no capture exists THEN the system SHALL report an explicit no-capture outcome and SHALL NOT generate a misleading empty audio file.
3. WHEN the system exports a capture THEN the exported file SHALL use a filename and media type that identify it as a capture-probe artifact and allow manual playback in common external tools.
4. IF the current host cannot honor addon-driven download/save behavior THEN the system SHALL fail truthfully with an operator-visible reason instead of silently succeeding.

### Requirement 4

**User Story:** As a debugger, I want a deliberate addon action that clears the current capture, so that I can restart the probe from a known clean state before the next test.

#### Acceptance Criteria

1. WHEN the operator runs `Clear Capture` THEN the system SHALL remove the current bounded capture from the addon-owned session state.
2. WHEN `Clear Capture` completes THEN the system SHALL update the visible capture summary to the empty state.
3. WHEN new SongSense audio arrives after a clear THEN the system SHALL start a fresh bounded capture rather than reviving cleared bytes.

### Requirement 5

**User Story:** As a maintainer, I want the probe addon to use an honest ownership boundary for shared capture state, so that the download and clear actions can operate without smuggling browser-specific logic into addon code.

#### Acceptance Criteria

1. WHEN the query path and addon actions share capture state THEN the system SHALL use an addon-owned sharing mechanism that does not require addon code to import browser-internal modules directly.
2. WHEN binary capture bytes are retained THEN the system SHALL keep them bounded and SHALL NOT serialize large raw audio payloads into primitive addon-global settings.
3. IF the first implementation keeps capture bytes session-scoped only THEN the system SHALL document that scope truthfully in repo-facing docs and operator-visible surfaces.
4. IF persisted typed runtime data is introduced for capture metadata THEN the system SHALL keep addon actions as the only executable mutation surface for that persisted truth.

### Requirement 6

**User Story:** As a debugger, I want structured probe logs around capture and export behavior, so that I can tell whether the addon received audio, trimmed it, exported it, or failed before export.

#### Acceptance Criteria

1. WHEN the probe adapter appends or trims capture audio THEN the system SHALL emit structured debug diagnostics describing the resulting capture summary.
2. WHEN the operator runs `Download Capture` or `Clear Capture` THEN the system SHALL emit structured diagnostics describing the action outcome.
3. IF export or clear fails THEN the system SHALL emit a failure diagnostic that includes the honest failure reason.

### Requirement 7

**User Story:** As a maintainer, I want the packaged addon and host integration truth to stay aligned, so that the shipped probe does not pretend download behavior exists where the host has not implemented it.

#### Acceptance Criteria

1. WHEN the addon package, report manifest, and repo docs are generated THEN the system SHALL describe the same capture-probe capabilities and limitations consistently.
2. IF browser-side generic addon download support is required for the probe to function THEN the system SHALL define and verify that host dependency explicitly rather than treating it as an implicit assumption.
3. WHEN the packaged addon is exercised through the normal Stage 1 host path THEN the system SHALL prove that download and clear behavior are reachable through the generic addon action runner.
