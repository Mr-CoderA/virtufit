import { useObjectUrl } from './use-object-url';
import { prepareImage } from './prepare-image';
import { useEffect, useRef, useState } from 'react';
import type { Garment } from './catalog';
import { validateProductFile, productFraming } from './product-image.mjs';

type Props = { photoCredits: number; active: boolean; garments: Garment[]; selected: Garment; configured: boolean; onSelect: (garment: Garment) => void; onUploadGarment: () => void; onSetup: () => void };

export function PhotoTryOn({ photoCredits, active, garments, selected, configured, onSelect, onUploadGarment, onSetup }: Props) {
  const [person, setPerson] = useState<File | null>(null);
  const preview = useObjectUrl(person);
  const [result, setResult] = useState<Blob | null>(null);
  const resultUrl = useObjectUrl(result);
  const [resultName, setResultName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileLoadRef = useRef(0);
  useEffect(() => () => { abortRef.current?.abort(); fileLoadRef.current++; }, []);
  useEffect(() => { if (!active) abortRef.current?.abort(); }, [active]);
  async function load(candidate?: File) {
    if (!candidate || busy) return;
    const issue = validateProductFile(candidate); if (issue) { setError(issue); return; }
    const generation = ++fileLoadRef.current;
    const url = URL.createObjectURL(candidate);
    try {
      const image = new Image(); image.src = url; await image.decode();
      if (generation !== fileLoadRef.current) return;
      setPerson(candidate); setResult(null); setError('');
    } catch { if (generation === fileLoadRef.current) setError('That image could not be opened. Choose a valid PNG, JPG or WebP photo.'); }
    finally { URL.revokeObjectURL(url); }
  }
  async function generate() {
    if (!configured) { onSetup(); return; }
    if (!person || busy) return;
    const controller = new AbortController(); abortRef.current = controller;
    const garment = selected;
    setBusy(true); setError('');
    try {
      const imageResponse = await fetch(garment.image, { signal: controller.signal });
      if (!imageResponse.ok) throw new Error('Could not load the garment image. Upload it again.');
      const [personUpload, garmentUpload] = await Promise.all([prepareImage(person), prepareImage(await imageResponse.blob())]);
      const form = new FormData(); form.append('person', personUpload, 'person.jpg'); form.append('garment', garmentUpload, 'garment.jpg'); form.append('prompt', garment.prompt);
      const response = await fetch('/api/photo-try-on', { method: 'POST', body: form, signal: controller.signal });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Could not generate this photo.'); }
      const image = await response.blob();
      if (!image.type.startsWith('image/')) throw new Error('The server returned an invalid image.');
      if (!controller.signal.aborted) { setResult(image); setResultName(garment.name); }
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not generate this photo.'); }
    finally { if (abortRef.current === controller) { abortRef.current = null; setBusy(false); } }
  }
  const downloadName = `VirtuFit-${resultName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${result?.type === 'image/png' ? 'png' : result?.type === 'image/webp' ? 'webp' : 'jpg'}`;
  return <section className="photo-studio" aria-label="Photo try-on studio">
    <div className="photo-intro"><div><p className="eyebrow">ONE PHOTO. A WHOLE NEW LOOK.</p><h2>Try it on. Keep the photo.</h2><p>Upload your photo, choose the clothes, and generate a finished image.</p></div><span className="photo-mode-badge">SINGLE IMAGE · NO LIVE STREAM</span></div>
    <div className="photo-workspace">
      <div className="photo-inputs"><div className="photo-step-heading"><span>01 / YOUR PHOTO</span>{person && <button className="text-button" disabled={busy} onClick={() => inputRef.current?.click()}>Change photo</button>}</div>
        <button className={`person-upload ${dragging ? 'dragging' : ''}`} disabled={busy} onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void load(e.dataTransfer.files[0]); }}
          onPaste={e => { const file = [...e.clipboardData.files].find(f => f.type.startsWith('image/')); if (file) { e.preventDefault(); void load(file); } }}>
          {preview ? <img src={preview} alt="Your original photo"/> : <><span className="photo-upload-symbol">＋</span><strong>Choose your photo</strong><small>Drop, paste or browse · PNG, JPG, WebP</small><small>Keep the clothing area visible. Up to 12 MB.</small></>}
        </button><input ref={inputRef} type="file" className="visually-hidden" tabIndex={-1} aria-label="Upload your photo" accept="image/png,image/jpeg,image/webp" onChange={e => void load(e.target.files?.[0])}/>
        <div className="photo-step-heading"><span>02 / THE CLOTHES</span><button className="text-button" disabled={busy} onClick={onUploadGarment}>＋ Upload garment</button></div>
        <div className="photo-garment"><img src={selected.image} alt={selected.name}/><div><label htmlFor="photo-garment-select">Choose a garment</label><select id="photo-garment-select" disabled={busy} value={selected.id} onChange={e => { const garment = garments.find(g => g.id === e.target.value); if (garment) onSelect(garment); }}>{garments.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select><small>{productFraming(selected.category || 'top')}</small></div></div>
        <p className="photo-disclosure">Generate sends this photo and garment image to Decart and uses your VirtuFit credits for one image. Nothing is streamed continuously.</p>
        {error && <p className="photo-error" role="alert">{error}</p>}
        {busy ? <div className="photo-generating"><span className="spinner"/><span>Creating your finished photo…</span><button className="outline" onClick={() => { abortRef.current?.abort(); setError('Stopped waiting. If generation already started, your credits may still be used.'); }}>Cancel</button></div> : <button className="primary full-width" disabled={configured && !person} onClick={() => void generate()}>{configured ? `Generate try-on · ${photoCredits} credits` : 'Sign in / Settings'} <span>↗</span></button>}
      </div>
      <div className="photo-result"><div className="photo-step-heading"><span>03 / YOUR NEW LOOK</span><span className="photo-output-size">720P IMAGE OUTPUT</span></div><div className="photo-result-canvas">{resultUrl ? <img src={resultUrl} alt={`Generated try-on wearing ${resultName}`}/> : <div className="photo-result-empty"><span>✳</span><h3>{busy ? 'A new look is on its way.' : 'Your next look starts here.'}</h3><p>{busy ? 'You can keep this tab open while the photo is generated.' : 'The generated image will appear here, ready to download.'}</p></div>}{busy && resultUrl && <div className="photo-result-loading"><div className="spinner"/>Generating a new look…</div>}</div><div className="photo-result-bottom"><span>{resultUrl ? resultName : 'Photo try-on · Powered by Lucy Image'}</span>{resultUrl && <a className="primary" href={resultUrl} download={downloadName}>↓ Download image</a>}</div></div>
    </div>
  </section>;
}
