# Seed 01: Stage 1 SongSense Capture Probe Addon

## Summary

Create `axolync-addon-songsense-capture-probe` as a dedicated diagnostic addon repo for a SongSense testing adapter that consumes the real Axolync audio-capture path, never reports a song detection, and instead lets the operator download the latest authoritative host-provided capture window for external verification.

This addon exists to answer one practical debugging question honestly:

- is the audio Axolync delivers to a SongSense adapter actually a legitimate, externally detectable song sample?

The intended operator flow is:

1. enable the capture-probe addon as the active SongSense addon
2. let Axolync listen to a real song through the normal capture path
3. run an addon action such as `Download Capture`
4. test the exported file manually in an external source-of-truth tool such as the operator's own Shazam app

Priority:
- `P1`

## Product Context

### Why This Addon Exists

Recent Vibra work proved that the current runtime can:

- capture SongSense audio
- deliver it into a Stage 1 addon
- load a real local runtime
- generate a fingerprint

But failed recognition still leaves an important ambiguity:

- is the failure in Axolync audio capture and delivery?
- in the adapter wrapper around the recognizer?
- or in the recognizer and lookup path itself?

Without a truthful way to export the exact audio that Axolync delivered to the addon, debugging keeps relying on guesswork.

### Why This Should Be A Standalone Repo

This is not a Vibra-specific helper.

It is a reusable diagnostic addon with its own long-term value:

- it exercises the real Stage 1 SongSense path
- it gives operators a manual truth artifact
- it can be reused for future SongSense adapter investigations beyond Vibra

That makes a standalone addon repo more honest than burying this inside `axolync-addon-vibra`.

### Desired Operator Experience

The operator should be able to:

- pick the capture-probe addon as the active SongSense addon
- let it retain the latest honest SongSense host window while live listening runs normally
- see lightweight addon-global capture state after action-boundary refreshes such as download or clear
- click `Download Capture` and receive a standard audio file
- click `Clear Capture` to reset the diagnostic buffer

The probe should never pretend to do real song recognition.

### Why Addon Actions Matter

The current product direction already moved executable addon-global behavior into contract-native addon actions, as seen in Whisper.

This addon should follow that same direction:

- passive state should stay passive
- active export and clear operations should be addon actions
- the addon should not import browser internals just to perform download logic

## Technical Constraints

### Repo Boundary

This feature belongs in `axolync-addon-songsense-capture-probe`.

The repo should become the honest home for:

- the capture-probe adapter
- addon-global diagnostic actions
- lightweight runtime data surfaces that describe current capture state

### Runtime Shape

The first implementation target should be:

- one Stage 1 local-js addon
- one SongSense adapter only
- no real detection logic

The adapter should:

- consume the genuine SongSense query payload
- keep the latest authoritative host-provided rolling SongSense window rather than blindly appending overlapping windows
- always return zero candidates

### Diagnostic Semantics

The addon is for testing, not sensing.

That means:

- it must never emit fake or placeholder detections
- it must not silently discard capture work when the payload is usable
- it must expose enough truth to understand what was captured without dumping raw bytes into the normal UI

### Capture Ownership

The implementation should avoid dishonest storage choices.

Specifically:

- large binary audio payloads should not be shoved into primitive addon settings
- lightweight summary state may live in addon-global settings or addon-local state only when that is size-appropriate
- raw capture bytes should remain bounded and should be shared between the query path and addon actions through an explicit honest addon-owned mechanism

The first implementation should keep capture bytes session-scoped only rather than promising durable cross-restart storage, and that decision must be explicit and reflected in docs and UI truth.

The first implementation should also make the sharing mechanism explicit:

- use a symbol-keyed `globalThis` session store keyed by addon identity
- rely only on the current hosted-web Stage 1 behavior where query modules and addon action modules run in the same JS realm
- scope support truthfully if a future host does not preserve that property

### Export Format

The exported artifact should be a standard audio file that can be tested manually outside Axolync.

The format should be:

- deterministic
- widely playable
- honest to the captured audio characteristics

The first format should favor compatibility and manual inspection over theoretical preservation of every internal detail.

The first default should be:

- WAV PCM16

### Download Capability

The operator asked for addon action driven download, but the current generic addon action host seam does not yet document a download/save capability.

This seed therefore must treat download as a real cross-repo integration concern rather than pretending the addon can complete the flow alone.

The intended direction is:

- addon-owned action logic decides what to export
- a generic host seam performs the actual save/download without addon code importing browser internals

### Runtime Surface Direction

The addon should expose a lightweight addon-global runtime surface summarizing capture state, such as:

- whether a capture exists
- capture duration
- sample rate
- channel count
- chunk count
- last update time

That runtime surface should remain semantic-only and should not try to render or transport raw bytes.

For the first implementation, that runtime surface should reflect action-boundary truth only:

- query-time capture updates may change the session-only in-memory buffer
- the visible addon-global summary should refresh on addon actions such as `Download Capture` and `Clear Capture`
- this seed should not pretend query-time adapters already have a generic host seam for immediate runtime-surface mutation

### Scope

This seed should:

- create the repo boundary for the diagnostic addon
- define a bounded capture-probe SongSense adapter
- define addon actions for download and clear
- define a lightweight capture summary runtime surface
- define the honest host/download boundary
- define how this addon helps isolate capture vs wrapper vs recognizer failures

This seed should not:

- implement real song recognition
- fix Vibra directly
- promise long-term archival recording behavior
- pretend browser host download support already exists when it does not

### Acceptance Direction

This seed should be considered successful when:

- the repo exists as the honest home for the probe addon
- the normal SongSense query path can retain one honest latest host window without emitting detections
- the operator has a truthful addon action path to download the current capture as a standard audio file
- the operator can clear the current capture deliberately
- addon-global runtime data shows lightweight action-boundary capture truth without exposing raw bytes in the normal surface
- the feature helps isolate whether future recognition failures originate in Axolync capture, adapter wrapping, or downstream recognizer behavior

## Open Questions

1. What is the first honest generic host contract for addon-driven file export:
   - extend `AddonActionContext` with a download/save capability
   - or teach the host to interpret a structured action result as a download request?

2. If a future host splits Stage 1 query modules and addon action modules across different JS realms, should this diagnostic addon:
   - stay hosted-web only
   - or drive a follow-on generic cross-realm capture-state seam first?
