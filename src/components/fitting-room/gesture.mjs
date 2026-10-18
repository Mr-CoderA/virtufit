// Map unmirrored camera coordinates to a mirrored object-fit:cover video.
export function mapFinger(point, videoWidth, videoHeight, rect) {
  const scale = Math.max(rect.width / videoWidth, rect.height / videoHeight);
  const width = videoWidth * scale, height = videoHeight * scale;
  return { x: rect.left + (1 - point.x) * width - (width - rect.width) / 2,
    y: rect.top + point.y * height - (height - rect.height) / 2 };
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function isPointing(hand) {
  if (hand.length < 21) return false;
  // Works for fingers pointing sideways as well as up: measure from the wrist.
  const indexExtended = distance(hand[8], hand[0]) > distance(hand[6], hand[0]) * 1.12;
  const folded = [12, 16, 20].filter(tip => distance(hand[tip], hand[0]) < distance(hand[tip - 2], hand[0]) * 1.13);
  return indexExtended && folded.length >= 2;
}

export class DwellSelector {
  constructor() { this.reset(); }
  reset() { this.target = null; this.since = 0; this.fired = false; this.anchor = null; }
  update(target, point, now, duration = 1000, tolerance = 45) {
    if (!target || !point) { this.reset(); return { progress: 0, selected: null }; }
    if (target !== this.target || !this.anchor || distance(point, this.anchor) > tolerance) {
      this.target = target; this.anchor = point; this.since = now; this.fired = false;
    }
    const progress = Math.min(1, (now - this.since) / duration);
    const selected = progress === 1 && !this.fired ? target : null;
    if (selected) this.fired = true;
    return { progress, selected };
  }
}
