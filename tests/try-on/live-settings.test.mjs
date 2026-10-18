import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveOptions, streamMetrics } from '../../src/components/fitting-room/live-settings.mjs';
test('HD requests a 1080p camera and output, while low-delay mode uses 720p', () => {
  assert.equal(liveOptions('1080p').width, 1920);
  assert.equal(liveOptions('1080p').connect.resolution, '1080p');
  assert.equal(liveOptions('720p').width, 1280);
  assert.equal(liveOptions('720p').connect.resolution, '720p');
  assert.equal(liveOptions('720p').connect.preferredVideoCodec, 'h264');
  assert.equal(liveOptions().connect.speed, undefined);
  assert.equal(liveOptions('1080p', true).connect.speed, 'fast');
});
test('network round trip is never presented as camera-to-display latency', () => {
  const value = streamMetrics({ video: { framesPerSecond: 29.8, frameWidth: 1920, frameHeight: 1080 }, connection: { currentRoundTripTime: .1 }, glassToGlass: null });
  assert.equal(value.latencyMs, null); assert.equal(value.networkRttMs, 100); assert.equal(value.fps, 30);
  assert.equal(streamMetrics({ glassToGlass: { medianMs: 420 }, video: null }).latencyMs, 420);
});
