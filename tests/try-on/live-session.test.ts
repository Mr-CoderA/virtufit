import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveReadiness, liveError } from '../../src/components/fitting-room/live-session';

test('connected camera passthrough never counts as AI output', () => {
  let live = 0;
  const session = liveReadiness(() => live++);
  session.connected(); session.garmentAccepted(); session.framePresented();
  assert.equal(live, 0);
  session.generationStarted();
  assert.equal(live, 0, 'an old frame must not reveal a normal webcam as AI');
  session.framePresented();
  assert.equal(live, 1);
  session.framePresented(); session.generationStarted();
  assert.equal(live, 1);
});
test('early generation and video events wait for a successful connect result', () => {
  let live = false;
  const session = liveReadiness(() => { live = true; });
  session.garmentAccepted(); session.generationStarted(); session.framePresented();
  assert.equal(live, false);
  session.connected();
  assert.equal(live, true);
});
test('cancellation ignores late connect and video callbacks', () => {
  let live = false;
  const session = liveReadiness(() => { live = true; });
  session.cancel(); session.connected(); session.garmentAccepted(); session.generationStarted(); session.framePresented();
  assert.equal(live, false); assert.equal(session.isPending(), false);
});
test('AI video without an accepted garment cannot report a successful try-on', () => {
  let live = false;
  const session = liveReadiness(() => { live = true; });
  session.connected(); session.generationStarted(); session.framePresented();
  assert.equal(live, false);
  session.garmentAccepted();
  assert.equal(live, false, 'wait for video after garment acknowledgement');
  session.framePresented();
  assert.equal(live, true);
});
test('live failures distinguish token, network and credit problems without exposing credentials', () => {
  assert.match(liveError({ code: 'TOKEN_EXPIRED', message: 'expired' }), /token expired.*TOKEN_EXPIRED/);
  assert.match(liveError({ code: 'WEBRTC_ICE_ERROR' }), /another network/);
  assert.match(liveError({ code: 'WEBRTC_SERVER_ERROR', message: 'insufficient credits' }), /owner.*credits/);
  const error = liveError({ message: 'Failed wss://api.example/?api_key=secret-value token=private-value' });
  assert.doesNotMatch(error, /secret-value|private-value|api.example/);
});
