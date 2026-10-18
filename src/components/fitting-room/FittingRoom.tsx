'use client';
import React, { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { createDecartClient } from '@decartai/sdk';
import { mapFinger, isPointing, DwellSelector } from './gesture.mjs';
import { catalog, type Garment } from './catalog';
import { UploadDialog, type ProductUpload } from './UploadDialog';
import { PhotoTryOn } from './PhotoTryOn';
import { liveOptions, streamMetrics } from './live-settings.mjs';
import { readWardrobe, saveProduct, removeProduct } from './wardrobe-store';
import { categories, productFraming } from './product-image.mjs';
import './room.css';

type RtClient = Awaited<ReturnType<ReturnType<typeof createDecartClient>['realtime']['connect']>>;
type Phase = 'idle' | 'connecting' | 'live';
const readable = (e: unknown) => typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string' ? e.message : 'Something went wrong. Please try again.';
const timeLabel = (n: number) => `${Math.floor(n / 60).toString().padStart(2, '0')}:${(n % 60).toString().padStart(2, '0')}`;

export default function FittingRoom({ initialMode = 'live' }: { initialMode?: 'live' | 'photo' }) {
  const [garments, setGarments] = useState(catalog);
  const [selected, setSelected] = useState(catalog[0]);
  const [applied, setApplied] = useState<string | null>(null);
  const [camera, setCamera] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<'live' | 'photo'>(initialMode);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [fastMode, setFastMode] = useState(false);
  const [metrics, setMetrics] = useState<{ latencyMs: number | null; networkRttMs: number | null; fps: number | null; width: number | null; height: number | null } | null>(null);
  const [configured, setConfigured] = useState(false);
  const [setup, setSetup] = useState(false);
  const [account, setAccount] = useState<{ freeAccess: boolean; signedIn?: boolean; credits?: number; liveCost?: number; photoCost?: number; dailyTryOns?: number }>({ freeAccess: true, dailyTryOns: 5 });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tracking, setTracking] = useState('Camera off');
  const [handsOn, setHandsOn] = useState(true);
  const [dwellMs, setDwellMs] = useState(1000);
  const [hover, setHover] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [compare, setCompare] = useState(false);
  const [duration, setDuration] = useState(30);
  const [remaining, setRemaining] = useState(30);
  const [switching, setSwitching] = useState(false);
  const [quality, setQuality] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [consent, setConsent] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [savedWardrobe, setSavedWardrobe] = useState<Garment[]>([]);
  const closeUpload = useCallback(() => setUploadOpen(false), []);
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLVideoElement>(null);
  const outputRef = useRef<HTMLVideoElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const aiStreamRef = useRef<MediaStream | null>(null);
  const rtRef = useRef<RtClient | null>(null);
  const handWorkerRef = useRef<Worker | null>(null);
  const gestureSnapshotRef = useRef({ garments, dwellMs });
  useEffect(() => { gestureSnapshotRef.current = { garments, dwellMs }; }, [garments, dwellMs]);
  const selectedRef = useRef(selected);
  const frameRef = useRef(0);
  const generationRef = useRef(0);
  const connectionBusyRef = useRef(false);
  const cameraGenerationRef = useRef(0);
  const queueRef = useRef<Garment | null>(null);
  const applyingRef = useRef(false);
  const blobsRef = useRef(new Map<string, Blob>());
  const customUrlsRef = useRef<string[]>([]);
  const selectRef = useRef<(g: Garment) => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    fetch('/api/status').then(r => r.json()).then(s => { setConfigured(s.configured); setAccount(s); }).catch(() => setError('VirtuFit is temporarily unavailable. Refresh and try again.'));
    readWardrobe().then(records => {
      if (cancelled) return;
      const restored = records.map(record => {
        const { blob, ...metadata } = record;
        const image = URL.createObjectURL(blob); customUrlsRef.current.push(image); blobsRef.current.set(metadata.id, blob);
        return { ...metadata, image };
      });
      setSavedWardrobe(restored);
      if (restored.length) {
        setGarments([...restored, ...catalog].slice(0, 5));
        selectedRef.current = restored[0]; setSelected(restored[0]);
      }
    }).catch(() => { /* Uploads remain available when browser storage is disabled. */ });
    return () => {
      cancelled = true;
      generationRef.current++; cameraGenerationRef.current++;
      cancelAnimationFrame(frameRef.current); handWorkerRef.current?.terminate();
      rtRef.current?.disconnect(); aiStreamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current?.getTracks().forEach(t => t.stop());
      customUrlsRef.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  useEffect(() => {
    const refresh = () => { void fetch('/api/status').then(r => r.ok ? r.json() : null).then(s => { if (s) { setConfigured(s.configured); setAccount(s); } }).catch(() => {}); };
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener('focus', refresh); clearInterval(timer); };
  }, []);

  function stopAI(message = '') {
    generationRef.current++;
    rtRef.current?.disconnect(); rtRef.current = null;
    aiStreamRef.current?.getTracks().forEach(t => t.stop()); aiStreamRef.current = null;
    if (outputRef.current) outputRef.current.srcObject = null;
    queueRef.current = null;
    setPhase('idle'); setApplied(null); setCompare(false); setQuality(''); setMetrics(null);
    if (message) setNotice(message);
  }
  function stopCamera() {
    cameraGenerationRef.current++; stopAI();
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
    if (inputRef.current) inputRef.current.srcObject = null;
    setCamera(false); setTracking('Camera off');
  }
  useEffect(() => {
    const leave = () => { if (document.hidden) stopAI('AI stopped because you left this tab. Your camera preview stays local.'); };
    const unload = () => { rtRef.current?.disconnect(); aiStreamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current?.getTracks().forEach(t => t.stop()); };
    document.addEventListener('visibilitychange', leave); window.addEventListener('pagehide', unload);
    return () => { document.removeEventListener('visibilitychange', leave); window.removeEventListener('pagehide', unload); };
  }, []);

  async function startCamera(id = deviceId) {
    if (cameraBusy) return;
    stopCamera(); setCameraBusy(true); setError(''); setNotice('');
    const generation = cameraGenerationRef.current;
    try {
      const settings = liveOptions(resolution, fastMode);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
        width: { ideal: settings.width }, height: { ideal: settings.height }, frameRate: settings.frameRate,
        ...(id ? { deviceId: { exact: id } } : { facingMode: 'user' })
      } });
      if (generation !== cameraGenerationRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const video = inputRef.current!; video.srcObject = stream; await video.play();
      stream.getVideoTracks()[0].addEventListener('ended', () => { if (streamRef.current === stream) { stopCamera(); setError('The camera disconnected. Reconnect it and start the camera again.'); } });
      setCamera(true);
      void import('@decartai/sdk');
      void garmentBlob(selectedRef.current).catch(() => {});
      const cams = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
      setDevices(cams); setDeviceId(stream.getVideoTracks()[0].getSettings().deviceId || '');
    } catch (e) {
      const name = e instanceof DOMException ? e.name : '';
      setError(name === 'NotAllowedError' ? 'Camera permission was denied. Allow the camera for this site in your browser and try again.' : name === 'NotFoundError' ? 'No webcam found. Connect a webcam and try again.' : name === 'NotReadableError' ? 'The camera is busy. Close other apps using it and try again.' : readable(e));
    } finally { setCameraBusy(false); }
  }

  useEffect(() => {
    // Synchronize the visible status when the external worker subscription stops.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!camera || !handsOn || mode !== 'live') { setTracking(camera ? 'Touchless paused' : 'Camera off'); setHover(null); setProgress(0); if (pointerRef.current) pointerRef.current.hidden = true; return; }
    let cancelled = false, ready = false, pending = false, lastTime = -1, lastTick = 0;
    let smooth: { x: number; y: number } | null = null;
    const dwell = new DwellSelector();
    const reset = () => { dwell.reset(); smooth = null; setHover(null); setProgress(0); if (pointerRef.current) pointerRef.current.hidden = true; };
    setTracking('Loading hand tracking…');
    const worker = new Worker('/vision/hand-tracker.worker.js');
    handWorkerRef.current = worker;
    worker.onmessage = event => {
      if (cancelled) return;
      if (event.data.type === 'ready') { ready = true; setTracking('Raise a hand to choose'); return; }
      pending = false;
      if (event.data.type === 'error') { ready = false; reset(); setTracking('Touchless unavailable'); setError(event.data.message); return; }
      if (event.data.type !== 'result') return;
      const video = inputRef.current, stage = stageRef.current;
      if (!video || !stage) return;
      const hands = event.data.landmarks as { x: number; y: number; z: number }[][];
      const hand = hands.find(isPointing);
      if (!hand) { reset(); setTracking(hands.length ? 'Extend your index finger' : 'Raise a hand to choose'); return; }
      const rect = stage.getBoundingClientRect();
      const raw = mapFinger(hand[8], video.videoWidth, video.videoHeight, rect);
      smooth = smooth ? { x: smooth.x + (raw.x - smooth.x) * .55, y: smooth.y + (raw.y - smooth.y) * .55 } : raw;
      const pointer = pointerRef.current!; pointer.hidden = false;
      pointer.style.left = `${smooth.x - rect.left}px`; pointer.style.top = `${smooth.y - rect.top}px`;
      let target: string | null = null;
      for (const el of stage.querySelectorAll<HTMLElement>('[data-garment]')) {
        const box = el.getBoundingClientRect();
        if (smooth.x >= box.left && smooth.x <= box.right && smooth.y >= box.top && smooth.y <= box.bottom) { target = el.dataset.garment!; break; }
      }
      const state = dwell.update(target, smooth, performance.now(), gestureSnapshotRef.current.dwellMs);
      setHover(target); setProgress(state.progress); setTracking(target ? 'Hold steady to select' : 'Point at an outfit');
      if (state.selected) { const garment = gestureSnapshotRef.current.garments.find(g => g.id === state.selected); if (garment) selectRef.current(garment); }
    };
    worker.onerror = () => { ready = false; pending = false; reset(); setTracking('Touchless unavailable'); setError('Hand tracking could not start. Clicking outfits still works. Toggle Touchless to retry.'); };
    worker.postMessage({ type: 'init' });
    function tick(now: number) {
      if (cancelled) return;
      const video = inputRef.current;
      // One frame in flight: stale camera frames never accumulate in a queue.
      if (ready && !pending && video && video.readyState >= 2 && video.currentTime !== lastTime && now - lastTick >= 50) {
        pending = true; lastTime = video.currentTime; lastTick = now;
        const width = 480, height = Math.round(width * video.videoHeight / video.videoWidth);
        createImageBitmap(video, { resizeWidth: width, resizeHeight: height, resizeQuality: 'low' }).then(bitmap => {
          if (cancelled) { bitmap.close(); return; }
          worker.postMessage({ type: 'frame', bitmap, timestamp: now }, [bitmap]);
        }).catch(() => { pending = false; });
      }
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(frameRef.current); worker.terminate(); if (handWorkerRef.current === worker) handWorkerRef.current = null; reset(); };
  }, [camera, handsOn, mode]);

  async function garmentBlob(garment: Garment) {
    let blob = blobsRef.current.get(garment.id);
    if (!blob) { const response = await fetch(garment.image); if (!response.ok) throw new Error('Could not load that outfit image.'); blob = await response.blob(); blobsRef.current.set(garment.id, blob); }
    return blob;
  }
  async function applyQueue() {
    if (applyingRef.current || !rtRef.current) return;
    applyingRef.current = true; setSwitching(true);
    const generation = generationRef.current;
    try {
      while (queueRef.current && rtRef.current && generation === generationRef.current) {
        const garment = queueRef.current; queueRef.current = null;
        const blob = await garmentBlob(garment);
        if (!rtRef.current || generation !== generationRef.current) break;
        await rtRef.current.setImage(blob, { prompt: garment.prompt, enhance: Boolean(garment.custom) });
        if (generation === generationRef.current) { setApplied(garment.id); setNotice(`${garment.name} applied.`); }
      }
    } catch (e) { if (generation === generationRef.current) setError(`Outfit could not be applied: ${readable(e)}`); }
    finally { applyingRef.current = false; setSwitching(false); if (queueRef.current && rtRef.current) void applyQueue(); }
  }
  function choose(garment: Garment) {
    if (selectedRef.current.id === garment.id && (applied === garment.id || !rtRef.current)) return;
    selectedRef.current = garment; setSelected(garment); setError('');
    if (rtRef.current) { queueRef.current = garment; void applyQueue(); }
    else if (mode === 'live') setNotice(`${garment.name} selected. Start AI try-on to wear it.`);
  }
  useEffect(() => { selectRef.current = choose; });

  async function startAI() {
    if (!configured) { setSetup(true); return; }
    if (!camera || !streamRef.current || connectionBusyRef.current) return;
    connectionBusyRef.current = true;
    const generation = ++generationRef.current;
    setPhase('connecting'); setError(''); setNotice('Preparing your live fitting room…');
    try {
      const { createDecartClient, models } = await import('@decartai/sdk');
      const initialGarment = selectedRef.current;
      const blob = await garmentBlob(initialGarment);
      const response = await fetch('/api/tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duration }) });
      const token = await response.json(); if (!response.ok) throw new Error(token.error);
      if (generation !== generationRef.current) return;
      const client = createDecartClient({ apiKey: token.apiKey, telemetry: false });
      const settings = liveOptions(resolution, fastMode);
      await streamRef.current!.getVideoTracks()[0].applyConstraints({ width: { ideal: settings.width }, height: { ideal: settings.height }, frameRate: settings.frameRate });
      // LiveKit stops published tracks on disconnect. Clone them so the local
      // mirror and hand tracker keep their own live camera track after AI stops.
      const aiStream = streamRef.current!.clone(); aiStreamRef.current = aiStream;
      const rt = await client.realtime.connect(aiStream, {
        model: models.realtime('lucy-vton-latest'), mirror: false, ...settings.connect,
        initialState: { image: blob, prompt: { text: initialGarment.prompt, enhance: Boolean(initialGarment.custom) } },
        retries: 1, capacityRetryBudgetMs: 15000,
        onRemoteStream: stream => { if (generation === generationRef.current && outputRef.current) { outputRef.current.srcObject = stream; void outputRef.current.play().catch(() => {}); } },
        onConnectionQuality: info => { if (generation === generationRef.current) setQuality(info.quality); }
      });
      if (generation !== generationRef.current || document.hidden) { rt.disconnect(); if (generation === generationRef.current) stopAI(); return; }
      rtRef.current = rt;
      rt.on('stats', stats => { if (generation === generationRef.current) setMetrics(streamMetrics(stats)); });
      rt.on('error', e => { if (generation === generationRef.current) { stopAI(); setError(`AI connection stopped: ${readable(e)}`); } });
      rt.on('connectionChange', state => { if (generation === generationRef.current && state === 'disconnected') stopAI('AI session disconnected. You can reconnect when ready.'); });
      rt.on('sessionEnded', info => { if (generation === generationRef.current) { stopAI(); setError(info.reason === 'insufficient_credits' ? 'The AI service has reached its allowance. Try again later.' : `Decart ended the session: ${info.reason.replace(/_/g, ' ')}.`); } });
      setApplied(initialGarment.id); setPhase('live'); setRemaining(duration); setNotice('You’re live. Point at another outfit to change.'); setConsent(false);
      if (selectedRef.current.id !== initialGarment.id) { queueRef.current = selectedRef.current; void applyQueue(); }
    } catch (e) { if (generation === generationRef.current) { stopAI(); setError(readable(e)); } }
    finally { connectionBusyRef.current = false; if (generation !== generationRef.current) setPhase('idle'); }
  }
  useEffect(() => {
    if (phase !== 'live') return;
    const end = Date.now() + duration * 1000;
    const timer = window.setInterval(() => { const left = Math.max(0, Math.ceil((end - Date.now()) / 1000)); setRemaining(left); if (left === 0) stopAI('Session timer reached. AI is stopped; start a new session whenever you’re ready.'); }, 250);
    return () => clearInterval(timer);
  }, [phase, duration]);

  function openUpload() { setUploadOpen(true); }
  async function addUpload(value: ProductUpload) {
    const categoryLabel = categories.find(c => c.id === value.category)?.label || 'Product image';
    const metadata = { id: `custom-${crypto.randomUUID()}`, name: value.name, detail: `Your wardrobe · ${categoryLabel}`, prompt: value.prompt, custom: true, category: value.category };
    if (value.save) {
      try { await saveProduct({ ...metadata, blob: value.file, savedAt: Date.now() }); }
      catch { throw new Error('Your browser could not save this product. Uncheck “Keep this product” to try it for this session.'); }
    }
    const image = URL.createObjectURL(value.file); customUrlsRef.current.push(image);
    const garment: Garment = { ...metadata, image };
    blobsRef.current.set(garment.id, value.file);
    if (value.save) setSavedWardrobe(current => [garment, ...current]);
    setGarments(current => [garment, ...current].slice(0, 5)); setUploadOpen(false); choose(garment);
  }
  function chooseFromLibrary(garment: Garment) {
    setGarments(current => [garment, ...current.filter(g => g.id !== garment.id)].slice(0, 5));
    setLibraryOpen(false); choose(garment);
  }
  async function removeFromLibrary(garment: Garment) {
    try { await removeProduct(garment.id); setSavedWardrobe(current => current.filter(g => g.id !== garment.id)); }
    catch { setError('Could not remove that product from the saved wardrobe.'); }
  }
  function snapshot() {
    const video = phase === 'live' && !compare ? outputRef.current : inputRef.current;
    if (!video?.videoWidth) { setError('The video is not ready for a snapshot yet.'); return; }
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!; ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `VirtuFit-${phase === 'live' && !compare ? selectedRef.current.id : 'original'}-${Date.now()}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }, 'image/png');
  }
  async function fullscreen() { if (document.fullscreenElement) await document.exitFullscreen(); else await stageRef.current?.requestFullscreen(); }
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSetup(false); setConsent(false); setLibraryOpen(false); } };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, []);

  const photoGarments = [...new Map([...garments, ...savedWardrobe, ...catalog].map(g => [g.id, g])).values()];
  function changeMode(next: 'live' | 'photo') { if (next === mode) return; stopCamera(); setMode(next); setError(''); setNotice(''); }

  return <div id="virtufit-room" className="app-shell">
    <main>
      <div className="intro"><div><p className="eyebrow">YOUR CLOTHES. A FRESH PERSPECTIVE.</p><h1>Find your next<br/><span>favourite fit.</span></h1></div><div className="intro-note"><span className="studio-tag">OPEN STUDIO</span><p>Free to try.<br/>Open to everyone.</p></div></div>
      <div className="studio-access"><span className="small-dot green"/> Free public studio <span>Up to {account.dailyTryOns ?? 5} daily try-ons · No sign-in needed</span><button className="text-button" onClick={() => setSetup(true)}>Studio settings ↗</button></div>
      <div className="mode-switch" aria-label="Try-on mode"><button className={mode === 'live' ? 'selected' : ''} aria-pressed={mode === 'live'} onClick={() => changeMode('live')}>Live mirror <span>REALTIME</span></button><button className={mode === 'photo' ? 'selected' : ''} aria-pressed={mode === 'photo'} onClick={() => changeMode('photo')}>Photo try-on <span>GENERATE AN IMAGE</span></button></div>
      <div className="live-section" hidden={mode !== 'live'}>
      <div className="room-toolbar"><div className="room-title"><span className="small-dot green"/> LIVE MIRROR <span className="divider">/</span><span className="quiet">YOUR CAMERA, YOUR SPACE</span></div><div className="toolbar-actions">{!camera && <button className="primary" disabled={cameraBusy} onClick={() => void startCamera()}>Start camera ↗</button>}<button className="chip" onClick={() => setSetup(true)}>{resolution} · {fastMode ? "Fast tier" : "Standard tier"}</button><button className="chip upload-shortcut" onClick={openUpload}>＋ Upload product</button><button className={handsOn ? 'chip active' : 'chip'} aria-pressed={handsOn} onClick={() => setHandsOn(!handsOn)}>☝ Touchless {handsOn ? 'on' : 'off'}</button><button className="icon-button" onClick={fullscreen} aria-label="Fullscreen mirror" title="Fullscreen mirror">⛶</button></div></div>
      <div className={`mirror ${camera ? 'camera-on' : ''}`} ref={stageRef}>
        <video ref={inputRef} autoPlay playsInline muted className="camera-video"/>
        <video ref={outputRef} autoPlay playsInline muted className={`camera-video output ${phase === 'live' && !compare ? 'visible' : ''}`}/>
        {!camera && <div className="empty-mirror"><div className="mirror-orbit"><svg viewBox="0 0 120 180" aria-hidden="true"><circle cx="60" cy="33" r="21"/><path d="M25 164V101C25 75 39 64 60 64S95 75 95 101V164M41 99V166M79 99V166M41 124H79"/></svg></div><p className="eyebrow">STEP INTO SOMETHING NEW</p><h2>Your mirror is ready.</h2><p>Start your camera. Find your next look.</p><button className="primary" disabled={cameraBusy} onClick={() => void startCamera()}>{cameraBusy ? 'Opening camera…' : 'Start camera'} <span>↗</span></button><small>Your camera stays local until you start AI try-on.</small></div>}
        <div className="mirror-top"><span className="mirror-badge"><span className={`small-dot ${phase === 'live' ? 'green' : ''}`}/>{phase === 'live' ? compare ? 'ORIGINAL VIEW' : 'AI TRY-ON LIVE' : camera ? 'LOCAL CAMERA' : 'CAMERA OFF'}</span>{phase === 'live' && <span className="timer">{timeLabel(remaining)} LEFT</span>}</div>
        <aside className="wardrobe"><div className="wardrobe-heading"><span>YOUR WARDROBE</span><span>{String(garments.length).padStart(2, '0')} LOOKS</span></div>{garments.map((g, i) => <button key={g.id} data-garment={g.id} className={`outfit ${selected.id === g.id ? 'selected' : ''} ${hover === g.id ? 'hovered' : ''}`} aria-pressed={selected.id === g.id} onClick={() => choose(g)} style={{ '--dwell': hover === g.id ? `${progress * 100}%` : '0%' } as CSSProperties}><span className="outfit-index">0{i + 1}</span><img src={g.thumbnail || g.image} alt={g.name}/><span className="outfit-copy"><strong>{g.name}</strong><small>{g.detail}</small></span><span className="outfit-check">{applied === g.id ? '✓' : selected.id === g.id ? '↗' : '+'}</span><span className="dwell-bar"/></button>)}<button className="add-outfit" onClick={openUpload}>＋ Upload product image</button><button className="library-button" onClick={() => setLibraryOpen(true)}>My wardrobe {savedWardrobe.length ? `(${savedWardrobe.length})` : ""} ↗</button></aside>
        <div className="mirror-bottom"><div className="tracking"><span className={`small-dot ${camera && handsOn ? 'green' : ''}`}/>{tracking}</div>{camera && <div className="framing-tip">{productFraming(selected.category || "top")}</div>}</div>
        <div className="finger-cursor" ref={pointerRef} hidden><div style={{ '--progress': `${progress * 360}deg` } as CSSProperties}/><span/></div>
        {phase === 'connecting' && <div className="connection-overlay"><div className="spinner"/><h2>Making the connection.</h2><p>Preparing Lucy’s live AI stream…</p><button className="outline" onClick={() => stopAI('Connection cancelled.')}>Cancel connection</button></div>}
      </div>
      {phase === 'live' && <div className="stream-metrics" aria-label="Live video performance"><span>{metrics?.latencyMs != null ? `Video delay ${Math.round(metrics.latencyMs)} ms` : 'Video delay: measuring…'}</span><span>{metrics?.fps != null ? `${metrics.fps} fps` : 'FPS: measuring…'}</span><span>{metrics?.width && metrics.height ? `${metrics.width} × ${metrics.height}` : `${resolution} requested`}</span>{metrics?.networkRttMs != null && <span>Network round trip {metrics.networkRttMs} ms</span>}<span>{quality ? `Connection ${quality}` : 'Connection warming up'}</span></div>}
      <div className="controlbar"><div className="current-look"><span className="eyebrow">{phase === 'live' && applied === selected.id ? 'NOW WEARING' : 'SELECTED LOOK'}</span><strong>{selected.name}</strong><span>{switching ? 'Applying your outfit…' : phase === 'live' ? quality ? `Connection: ${quality}` : 'Live AI mirror' : 'Ready when you are'}</span></div><div className="controls">{camera && <><button className="outline" onClick={snapshot} title="Save a snapshot to your device">↓ Save photo</button>{phase === 'live' && <button className="outline" aria-pressed={compare} onClick={() => setCompare(!compare)}>{compare ? 'Show try-on' : 'View original'}</button>}<button className="text-button" onClick={stopCamera}>Camera off</button></>}{phase === 'live' ? <button className="primary stop" onClick={() => stopAI('AI stopped. Your webcam preview stays local.')}>■ Stop AI</button> : phase === 'connecting' ? <button className="primary" onClick={() => stopAI('Connection cancelled.')}>Cancel</button> : camera ? <button className="primary" disabled={phase !== 'idle'} onClick={() => configured ? setConsent(true) : setSetup(true)}>Start AI try-on <span>↗</span></button> : <button className="primary" disabled={cameraBusy} onClick={() => void startCamera()}>{cameraBusy ? 'Opening camera…' : 'Start camera'} <span>↗</span></button>}</div></div>
      </div>
      <div hidden={mode !== 'photo'}><PhotoTryOn active={mode === 'photo'} garments={photoGarments} selected={selected} configured={configured} freeAccess={account.freeAccess} photoCredits={account.photoCost ?? 2} onSelect={chooseFromLibrary} onUploadGarment={openUpload} onSetup={() => setSetup(true)}/></div>
      {(error || notice) && <div className={`message ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>{error || notice}<button aria-label="Dismiss message" onClick={() => { setError(''); setNotice(''); }}>×</button></div>}
      <div className="instructions" hidden={mode !== 'live'}><div><span className="step-number">01</span><p><strong>Meet your mirror.</strong><span>Allow your camera and take a step back.</span></p></div><div><span className="step-number">02</span><p><strong>Find your look.</strong><span>Point your index finger at an outfit. Hold for {dwellMs / 1000}s.</span></p></div><div><span className="step-number">03</span><p><strong>Make it yours.</strong><span>Upload any product. Try it live. Save your favourite.</span></p></div></div>
    </main>
    {setup && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setSetup(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="setup-title"><button autoFocus className="modal-close" aria-label="Close setup" onClick={() => setSetup(false)}>×</button><p className="eyebrow">MAKE YOURSELF AT HOME</p><h2 id="setup-title">Make the studio yours.</h2><p>Try clothes live or create a finished photo. No account, payment or API key is needed.</p><p>Up to {account.dailyTryOns ?? 5} free try-ons per browser each day. Shared network and studio limits keep the service available for everyone. Sessions stop automatically.</p>{!configured && <p role="status">AI is temporarily unavailable. You can still preview your camera and build your wardrobe.</p>}<div className="settings"><h3>Live video quality</h3><label htmlFor="live-resolution">Resolution</label><select id="live-resolution" disabled={phase !== 'idle'} value={resolution} onChange={e => setResolution(e.target.value as '720p' | '1080p')}><option value="1080p">1080p — sharper detail</option><option value="720p">720p — lowest bandwidth and delay</option></select><small>1080p is requested from the model. The live performance bar shows the actual output dimensions, frame rate and camera-to-display delay when available.</small><label className="save-product"><input type="checkbox" disabled={phase !== 'idle'} checked={fastMode} onChange={e => setFastMode(e.target.checked)}/> Use faster processing (US region)</label><small>Decart’s SDK lists fast tier availability in the US region. From your connection, network distance can offset the faster processing. Compare the measured video delay; 720p can help if bandwidth is limited.</small><h3>Your preferences</h3><label htmlFor="session-length">AI session limit</label><select id="session-length" disabled={phase !== 'idle'} value={duration} onChange={e => setDuration(Number(e.target.value))}><option value={30}>30 seconds</option><option value={60}>1 minute</option></select><small>AI stops at the limit or when you leave the tab. Choose a short session to explore your look. Starting a session uses one daily try-on, including if you stop early.</small><label htmlFor="dwell-duration">Hold to select</label><select id="dwell-duration" value={dwellMs} onChange={e => setDwellMs(Number(e.target.value))}><option value={750}>0.75 seconds</option><option value={1000}>1 second</option><option value={1500}>1.5 seconds</option></select>{devices.length > 0 && <><label htmlFor="camera-source">Camera</label><select id="camera-source" disabled={phase !== 'idle' || cameraBusy} value={deviceId} onChange={e => { setDeviceId(e.target.value); if (camera) void startCamera(e.target.value); }}>{devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}</select></>}</div><button className="outline full-width" onClick={() => setSetup(false)}>Back to the mirror</button></section></div>}
    {consent && <div className="modal-backdrop"><section className="modal compact" role="dialog" aria-modal="true" aria-labelledby="consent-title"><button autoFocus className="modal-close" aria-label="Close" onClick={() => setConsent(false)}>×</button><p className="eyebrow">YOUR NEXT LOOK IS WAITING</p><h2 id="consent-title">Go live with Lucy.</h2><p>Starting AI sends your live webcam video and selected outfit image to <strong>Decart</strong> to generate the try-on stream. Hand tracking runs locally. Microphone audio is off.</p><div className="session-summary"><span>Automatic stop</span><strong>{timeLabel(duration)}</strong></div><p className="live-tier-notice">{resolution} · {fastMode ? "Faster processing selected." : "Standard compute tier selected."}</p><p className="fine-print">This uses one free daily try-on, including if you stop early. Stop AI at any time. This visual preview doesn’t measure clothing size or guarantee fit.</p><button className="primary full-width" onClick={() => { setConsent(false); void startAI(); }}>Start free try-on <span>↗</span></button></section></div>}
    {uploadOpen && <UploadDialog live={phase === 'live'} onClose={closeUpload} onAdd={addUpload}/>}
    {libraryOpen && <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) setLibraryOpen(false); }}><section className="modal wardrobe-modal" role="dialog" aria-modal="true" aria-labelledby="library-title"><button autoFocus className="modal-close" aria-label="Close wardrobe" onClick={() => setLibraryOpen(false)}>×</button><p className="eyebrow">YOURS TO COME BACK TO</p><h2 id="library-title">Your wardrobe.</h2><p>Products are saved in this browser on your device. {phase === 'live' ? 'Choose one to send its image to Decart and try it on now.' : 'Choose one to bring it into the mirror.'}</p>{!savedWardrobe.length && <p className="library-empty">Your saved products will appear here. Upload an image to add your first look.</p>}<div className="library-grid">{savedWardrobe.map(garment => <div className="library-item" key={garment.id}><button className="library-product" onClick={() => chooseFromLibrary(garment)}><img src={garment.thumbnail || garment.image} alt={garment.name}/><strong>{garment.name}</strong><small>Try this look ↗</small></button><button className="remove-product" aria-label={`Remove ${garment.name} from saved wardrobe`} onClick={() => void removeFromLibrary(garment)}>Remove from saved wardrobe</button></div>)}</div><h3 className="sample-heading">The sample collection</h3><div className="library-grid">{catalog.map(garment => <button className="library-product" key={garment.id} onClick={() => chooseFromLibrary(garment)}><img src={garment.thumbnail || garment.image} alt={garment.name}/><strong>{garment.name}</strong><small>{garment.detail}</small></button>)}</div><button className="primary full-width" onClick={() => { setLibraryOpen(false); openUpload(); }}>Upload a product <span>↗</span></button></section></div>}
  </div>;
}


