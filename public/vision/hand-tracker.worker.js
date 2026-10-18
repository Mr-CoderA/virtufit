// A classic worker is required by MediaPipe's UMD WebAssembly loader.
// All scripts, model bytes and WASM are served from this local app.
importScripts('/vision/vision_bundle.js');
const { FilesetResolver, HandLandmarker } = self.Vision;
let detector = null;
self.onmessage = async event => {
  if (event.data.type === 'init') {
    try {
      const files = await FilesetResolver.forVisionTasks('/vision/wasm');
      const common = { runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: .6, minTrackingConfidence: .6 };
      try { detector = await HandLandmarker.createFromOptions(files, { ...common, baseOptions: { modelAssetPath: '/vision/hand_landmarker.task', delegate: 'GPU' } }); }
      catch { detector = await HandLandmarker.createFromOptions(files, { ...common, baseOptions: { modelAssetPath: '/vision/hand_landmarker.task', delegate: 'CPU' } }); }
      self.postMessage({ type: 'ready' });
    } catch { self.postMessage({ type: 'error', message: 'Hand tracking could not load. Click outfits or toggle Touchless to retry.' }); }
  } else if (event.data.type === 'frame') {
    const bitmap = event.data.bitmap;
    try { const result = detector?.detectForVideo(bitmap, event.data.timestamp); self.postMessage({ type: 'result', landmarks: result?.landmarks || [] }); }
    catch { self.postMessage({ type: 'error', message: 'Hand tracking interrupted. Toggle Touchless to retry.' }); }
    finally { bitmap.close(); }
  }
};
