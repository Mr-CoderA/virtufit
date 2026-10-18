import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useObjectUrl } from './use-object-url';
import { categories, productPrompt, productFraming, validateProductFile } from './product-image.mjs';

export type ProductUpload = { name: string; category: string; prompt: string; file: File; save: boolean };
type Props = { live: boolean; onClose: () => void; onAdd: (value: ProductUpload) => Promise<void> };

export function UploadDialog({ live, onClose, onAdd }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const preview = useObjectUrl(file);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('auto');
  const [description, setDescription] = useState('');
  const [save, setSave] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  function load(candidate?: File) {
    if (!candidate) return;
    const issue = validateProductFile(candidate); setError(issue);
    if (issue) return;
    setFile(candidate); setName(candidate.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') || 'My outfit');
  }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key !== 'Tab') return;
      const elements = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select,textarea,a,summary') || [])].filter(el => el.getClientRects().length);
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', keys);
    return () => { window.removeEventListener('keydown', keys); previous?.focus(); };
  }, [onClose, busy]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!file || busy) return;
    setBusy(true); setError('');
    try { await onAdd({ file, name: name.trim() || 'My outfit', category, prompt: productPrompt(category, description), save }); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not add this image. Try again.'); }
    finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
    <section className="modal compact product-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="upload-title"
      onPaste={event => { const pasted = [...event.clipboardData.files].find(f => f.type.startsWith('image/')); if (pasted) { event.preventDefault(); load(pasted); } }}>
      <button className="modal-close" disabled={busy} aria-label="Close upload" onClick={onClose}>×</button>
      <p className="eyebrow">ANY PRODUCT. YOUR PERSONAL MIRROR.</p><h2 id="upload-title">Upload it. Try it on.</h2>
      <p>Add a product photo, a screenshot, or something from your wardrobe.</p>
      <form onSubmit={submit}>
        <button type="button" className={`upload-drop ${dragging ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()}
          onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); load(event.dataTransfer.files[0]); }}>
          {preview ? <><img src={preview} alt="Product image preview"/><span className="change-photo">Choose another image</span></> : <><span>＋</span><strong>Drop, paste or choose an image</strong><small>PNG, JPG or WebP · up to 12 MB</small></>}
        </button>
        <input ref={inputRef} className="visually-hidden" tabIndex={-1} type="file" aria-label="Choose a product image" accept="image/png,image/jpeg,image/webp" onChange={e => load(e.target.files?.[0])}/>
        <small>A clear garment photo on a plain background works best.</small>
        <label htmlFor="product-category">What are you trying on?</label><select id="product-category" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <div className="product-framing">↔ {productFraming(category)}</div>
        <details className="upload-details"><summary>Name & optional details</summary><label htmlFor="product-name">Name</label><input id="product-name" value={name} onChange={e => setName(e.target.value)} placeholder="My outfit" maxLength={80}/><label htmlFor="product-description">Garment details</label><textarea id="product-description" value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={500} placeholder="e.g. Olive linen, embroidered collar, relaxed fit"/><small>A try-on prompt is generated for you. Add details only if needed.</small></details>
        <label className="save-product"><input type="checkbox" checked={save} onChange={e => setSave(e.target.checked)}/> Keep this product in my local wardrobe</label>
        <small>{live ? 'Your AI session is live. Trying this product sends its image to Decart.' : 'The image stays on this device until you start an AI try-on session.'}</small>
        {error && <p className="upload-error" role="alert">{error}</p>}
        <button className="primary full-width" disabled={!file || busy}>{busy ? 'Preparing your product…' : live ? 'Try this product now' : 'Add product to my mirror'} <span>↗</span></button>
      </form>
    </section>
  </div>;
}
