function emitStage1Debug(input, entry) {
  const emitDebugLog = input?.__stage1AddonContext?.emitDebugLog;
  if (typeof emitDebugLog === 'function') {
    emitDebugLog(entry);
  }
}

export class CaptureProbeSongSenseAdapter {
  async query_song_candidates(input = {}) {
    emitStage1Debug(input, {
      level: 'info',
      message: '[axolync-addon-songsense-capture-probe] scaffolded probe adapter observed a SongSense query and intentionally returned no candidates.',
      payload: {
        reason: 'scaffold-no-detection',
      },
    });
    return [];
  }
}
