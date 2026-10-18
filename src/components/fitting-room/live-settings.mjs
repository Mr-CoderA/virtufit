/** @returns {{width: number, height: number, frameRate: {ideal: number, max: number}, connect: {resolution: '720p' | '1080p', preferredVideoCodec: 'h264', speed?: 'fast'}}} */
export function liveOptions(resolution = '1080p', fast = false) {
  const hd = resolution === '1080p';
  return {
    width: hd ? 1920 : 1280, height: hd ? 1080 : 720,
    frameRate: { ideal: 30, max: 30 },
    connect: { resolution: hd ? '1080p' : '720p', preferredVideoCodec: 'h264', ...(fast ? { speed: 'fast' } : {}) },
  };
}
export function streamMetrics(stats) {
  return {
    latencyMs: stats.glassToGlass?.medianMs ?? null,
    networkRttMs: stats.connection?.currentRoundTripTime != null ? Math.round(stats.connection.currentRoundTripTime * 1000) : null,
    fps: stats.video?.framesPerSecond != null ? Math.round(stats.video.framesPerSecond) : null,
    width: stats.video?.frameWidth ?? null,
    height: stats.video?.frameHeight ?? null,
  };
}
