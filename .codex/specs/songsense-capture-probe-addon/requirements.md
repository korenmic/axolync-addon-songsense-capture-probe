# Requirements Document

## Introduction

`axolync-addon-songsense-capture-probe` is a testing-only Stage 1 SongSense addon that exercises the real Axolync audio-capture path without performing recognition. Instead of returning candidates, it retains the latest honest host-provided SongSense capture window and exposes addon actions that let the operator download or clear that capture. The exported file becomes a manual source-of-truth artifact for isolating whether future failures come from Axolync capture, an adapter wrapper, or a downstream recognizer.

## Requirements

### Requirement 1

**User Story:** As a debugger, I want a real SongSense addon that captures the same audio Axolync sends to a detector, so that I can inspect the host-delivered audio independently of any recognizer.

#### Acceptance Criteria

1. WHEN `query_song_candidates` receives a usable SongSense audio payload THEN the system SHALL use the incoming audio-time metadata to decide whether that payload becomes the retained diagnostic capture.
2. WHEN `query_song_candidates` receives a newer authoritative host window THEN the system SHALL replace the retained diagnostic capture with that latest host window instead of appending overlapping rolling-window audio.
3. WHEN `query_song_candidates` receives an older or non-advancing host window THEN the system SHALL leave the retained capture unchanged and SHALL emit a stale-window diagnostic.
4. WHEN `query_song_candidates` receives no usable SongSense audio payload THEN the system SHALL leave the retained capture unchanged and SHALL return zero candidates.
5. WHEN the probe adapter processes any query THEN the system SHALL return zero SongSense candidates and SHALL NOT emit placeholder or fake detections.

### Requirement 2

**User Story:** As a debugger, I want the probe addon to expose lightweight capture state on honest refresh boundaries, so that I can understand what capture snapshot is currently available without pretending the host already supports live query-time surface mutation.

#### Acceptance Criteria

1. WHEN `Download Capture` or `Clear Capture` completes THEN the system SHALL refresh a lightweight addon-global capture summary that includes whether capture exists, duration, sample rate, channel count, and chunk count.
2. WHEN no capture exists after an action-boundary refresh THEN the system SHALL expose an explicit empty-state summary rather than stale prior values.
3. WHEN query-time capture changes between addon actions THEN the system SHALL treat the visible runtime surface as action-boundary truth and SHALL NOT claim immediate live summary refresh without a dedicated host seam.
4. WHEN the addon-global runtime surface is rendered THEN the system SHALL surface semantic capture metadata only and SHALL NOT expose raw audio bytes in the normal settings surface.

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

**User Story:** As a maintainer, I want the probe addon to use an explicit honest ownership boundary for shared capture state, so that the download and clear actions can operate without smuggling browser-specific logic into addon code or relying on accidental module-singleton behavior.

#### Acceptance Criteria

1. WHEN the first implementation shares session capture between `query_song_candidates` and addon actions on the current hosted-web Stage 1 host THEN the system SHALL use an explicit symbol-keyed `globalThis` store keyed by addon identity.
2. IF a host cannot provide same-realm execution for query modules and addon action modules THEN the system SHALL scope support truthfully or fail explicitly rather than claiming the shared session store works everywhere.
3. WHEN binary capture bytes are retained THEN the system SHALL keep them bounded and SHALL NOT serialize large raw audio payloads into primitive addon-global settings.
4. IF the first implementation keeps capture bytes session-scoped only THEN the system SHALL document that scope truthfully in repo-facing docs and operator-visible surfaces.
5. IF persisted typed runtime data is introduced for capture metadata THEN the system SHALL keep addon actions as the only executable mutation surface for that persisted truth.

### Requirement 6

**User Story:** As a debugger, I want structured probe logs around capture and export behavior, so that I can tell whether the addon received audio, trimmed it, exported it, or failed before export.

#### Acceptance Criteria

1. WHEN the probe adapter replaces, suppresses, resets, or clears retained capture state THEN the system SHALL emit structured debug diagnostics describing the resulting capture summary.
2. WHEN the probe adapter replaces a prior retained host window or suppresses a stale one THEN the system SHALL emit structured diagnostics describing that decision.
3. WHEN the operator runs `Download Capture` or `Clear Capture` THEN the system SHALL emit structured diagnostics describing the action outcome.
4. IF export or clear fails THEN the system SHALL emit a failure diagnostic that includes the honest failure reason.

### Requirement 7

**User Story:** As a maintainer, I want the packaged addon and host integration truth to stay aligned, so that the shipped probe does not pretend download behavior exists where the host has not implemented it.

#### Acceptance Criteria

1. WHEN the addon package, report manifest, and repo docs are generated THEN the system SHALL describe the same capture-probe capabilities and limitations consistently.
2. IF browser-side generic addon download support is required for the probe to function THEN the system SHALL define and verify that host dependency explicitly rather than treating it as an implicit assumption.
3. WHEN the packaged addon is exercised through the normal Stage 1 host path THEN the system SHALL prove that download and clear behavior are reachable through the generic addon action runner.
4. WHEN the packaged addon claims runtime-surface capture truth THEN the system SHALL describe that truth as action-boundary snapshot state rather than live query-time mutation unless a broader host seam exists.
