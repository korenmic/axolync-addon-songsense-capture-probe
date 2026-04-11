# Axolync SongSense Capture Probe Addon

Diagnostic Stage 1 addon repo for a SongSense capture-probe adapter.

This repo currently holds the seed and Kiro trio for a testing-only addon that:

- consumes the real Axolync SongSense audio capture path
- never emits a song detection
- keeps a bounded capture buffer for debugging
- exposes addon actions to download or clear the captured audio

The goal is to produce a trustworthy exported audio artifact that can be tested outside Axolync to isolate whether failures come from:

- Axolync audio capture and delivery
- the adapter wrapper lane
- or the downstream recognizer lane such as Vibra/Shazam lookup
