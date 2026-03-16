'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, ImageIcon, Loader2 } from 'lucide-react';

// eslint-disable-next-line @next/next/no-img-element -- blob previews
const Img = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...p} alt={p.alt ?? ''} />;

function ResultImage({ url, index }: { url: string; index: number }) {
  const [failed, setFailed] = useState(false);
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity bg-[#222219]"
      style={{ border: '0.5px solid rgba(240,239,232,0.14)' }}
    >
      {failed ? (
        <div className="flex flex-col items-center justify-center w-full max-w-[320px] h-[200px] text-[#65635D] text-[14px] gap-2">
          <ImageIcon className="h-10 w-10 opacity-60" />
          <span>Image unavailable — <span className="text-[#D9714A]">open in new tab</span></span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={proxyUrl}
          alt={`Output ${index + 1}`}
          className="object-cover w-full h-auto max-w-[320px] block"
          onError={() => setFailed(true)}
        />
      )}
    </a>
  );
}

import { GlassCard } from '@/components/ui/GlassCard';
import { ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { brandFetch } from '@/lib/brand-api';

const MAX_GARMENTS = 5;
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type Tier = 'nano' | 'basic' | 'pro';
type PreferredResolution = '1K' | '2K' | '4K';

function resolutionToTier(res: PreferredResolution): Tier {
  if (res === '1K') return 'basic';
  if (res === '2K' || res === '4K') return 'pro';
  return 'basic';
}

function tierCredits(tier: Tier): number {
  return tier === 'pro' ? 3 : 1;
}

export function TryOnDemo({ credits, preferredResolution }: { credits: number; preferredResolution: PreferredResolution | string | null }) {
  const res = (preferredResolution === '1K' || preferredResolution === '2K' || preferredResolution === '4K' ? preferredResolution : '1K') as PreferredResolution;
  const tier = resolutionToTier(res);
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [garmentFiles, setGarmentFiles] = useState<File[]>([]);
  const [swapTarget, setSwapTarget] = useState<string>('full_outfit');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    output_url: string;
    output_urls: string[];
    credits_used: number;
    credits_remaining: number;
    processing_time_ms: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'queued' | 'processing' | 'completed' | 'failed' | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const personInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  function handlePersonChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error('Person image must be under 10MB');
      return;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error('Use JPEG, PNG, or WebP');
      return;
    }
    setPersonFile(f);
    setResult(null);
    setError(null);
  }

  function handleGarmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) return false;
      if (!ALLOWED_TYPES.includes(f.type)) return false;
      return true;
    });
    if (valid.length !== files.length) toast.error('Each garment must be under 10MB and JPEG/PNG/WebP');
    setGarmentFiles((prev) => [...prev, ...valid].slice(0, MAX_GARMENTS));
    setResult(null);
    setError(null);
  }

  function removeGarment(i: number) {
    setGarmentFiles((prev) => prev.filter((_, j) => j !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!personFile || garmentFiles.length === 0) {
      toast.error('Add a person photo and at least one garment image');
      return;
    }
    const cost = tierCredits(tier) * garmentFiles.length;
    if (credits < cost) {
      toast.error(`Insufficient credits. Need ${cost} (${garmentFiles.length} garment${garmentFiles.length === 1 ? '' : 's'}), you have ${credits}. Top up from the dashboard.`);
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const form = new FormData();
    form.append('person_image', personFile);
    garmentFiles.forEach((f) => form.append('garment_image', f));
    form.append('tier', tier);
    form.append('swap_target', swapTarget);
    if (description.trim()) form.append('garment_description', description.trim());

    try {
      const res = await brandFetch('/api/v1/generate', {
        method: 'POST',
        body: form,
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLoading(false);
        if (res.status === 402) {
          setError(`Insufficient credits. Need ${data.required ?? cost}, you have ${data.balance ?? credits}.`);
        } else if (res.status === 504) {
          setError('Generation timed out. Please try again.');
        } else {
          setError(data.error || data.details || `Request failed (${res.status})`);
        }
        return;
      }

      if (res.status === 202 && data.accepted && data.job_id) {
        setJobId(data.job_id);
        setJobStatus('queued');
        setQueuePosition(data.position ?? 0);
        setElapsedSeconds(0);
        toast.success('Job queued. Waiting for result…');
        const poll = () => {
          brandFetch(`/api/v1/jobs/${data.job_id}`, { credentials: 'include' })
            .then((r) => r.json().catch(() => ({})))
            .then((job: { status: string; position?: number; elapsed_seconds?: number; output_url?: string; output_urls?: string[]; credits_used?: number; credits_remaining?: number; processing_ms?: number; error?: string }) => {
              setJobStatus(job.status as 'queued' | 'processing' | 'completed' | 'failed');
              if (job.position != null) setQueuePosition(job.position);
              if (job.elapsed_seconds != null) setElapsedSeconds(job.elapsed_seconds);
              if (job.status === 'completed') {
                if (pollRef.current) clearInterval(pollRef.current);
                pollRef.current = null;
                setResult({
                  output_url: job.output_url ?? job.output_urls?.[0] ?? '',
                  output_urls: job.output_urls ?? [job.output_url ?? ''],
                  credits_used: job.credits_used ?? cost,
                  credits_remaining: job.credits_remaining ?? credits - cost,
                  processing_time_ms: job.processing_ms ?? 0,
                });
                setJobId(null);
                setJobStatus(null);
                setLoading(false);
                toast.success(`Try-on complete. ${job.credits_used} credit(s) used.`);
              } else if (job.status === 'failed') {
                if (pollRef.current) clearInterval(pollRef.current);
                pollRef.current = null;
                setError(job.error ?? 'Generation failed. No credits were charged.');
                setJobId(null);
                setJobStatus(null);
                setLoading(false);
              }
            });
        };
        poll();
        pollRef.current = setInterval(poll, 3000);
        return;
      }

      if (data.success && data.output_url) {
        setResult({
          output_url: data.output_url,
          output_urls: data.output_urls ?? [data.output_url],
          credits_used: data.credits_used ?? cost,
          credits_remaining: data.credits_remaining ?? credits - cost,
          processing_time_ms: data.processing_time_ms ?? 0,
        });
        toast.success(`Try-on complete. ${data.credits_used} credit(s) used.`);
      } else {
        setError(data.error || 'No output from API');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      toast.error('Request failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <ButtonLink href="/dashboard" variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to dashboard
        </ButtonLink>
      </div>

      <GlassCard
        className="pt-9 px-8 pb-10"
        style={{ borderWidth: '0.5px', backgroundColor: '#222219', borderColor: 'rgba(240,239,232,0.08)' }}
      >
        <h2
          className="text-[20px] font-normal tracking-[-0.02em] text-[#F0EFE8] mb-1"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Virtual try-on demo
        </h2>
        <p className="text-[15px] leading-[1.75] text-[#A09E97] mb-8">
          Upload your photo and the item you want to try on. Choose what to swap: full outfit, top, watch, glasses, shoes, or other. Uses your account credits.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-6">
            <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2.5">
              Person photo (required)
            </label>
            <input
              ref={personInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handlePersonChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => personInputRef.current?.click()}
              className="w-full flex items-center gap-3 text-left rounded-[12px] py-5 px-[18px] bg-[#222219] border border-[rgba(240,239,232,0.08)] hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)] transition-[background-color,border-color] duration-200"
              style={{ borderWidth: '0.5px' }}
            >
              {personFile ? (
                <>
                  <Img
                    src={URL.createObjectURL(personFile)}
                    alt="Person"
                    className="rounded-lg object-cover w-16 h-16"
                  />
                  <span className="text-[15px] text-[#F0EFE8]">{personFile.name}</span>
                </>
              ) : (
                <>
                  <div
                    className="w-9 h-9 rounded-lg bg-[#2C2C27] flex items-center justify-center shrink-0"
                    style={{ border: '0.5px solid rgba(240,239,232,0.14)' }}
                  >
                    <Upload className="h-4 w-4 text-[#65635D]" />
                  </div>
                  <span className="text-[15px] text-[#A09E97]">Click to upload your photo (max 10MB)</span>
                </>
              )}
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2.5">
              Garment image(s) (1–5)
            </label>
            <input
              ref={garmentInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              multiple
              onChange={handleGarmentChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => garmentInputRef.current?.click()}
              className="w-full flex items-center gap-3 text-left rounded-[12px] py-5 px-[18px] bg-[#222219] border border-[rgba(240,239,232,0.08)] hover:bg-[#2C2C27] hover:border-[rgba(240,239,232,0.14)] transition-[background-color,border-color] duration-200 mb-2"
              style={{ borderWidth: '0.5px' }}
            >
              <div
                className="w-9 h-9 rounded-lg bg-[#2C2C27] flex items-center justify-center shrink-0"
                style={{ border: '0.5px solid rgba(240,239,232,0.14)' }}
              >
                <ImageIcon className="h-4 w-4 text-[#65635D]" />
              </div>
              <span className="text-[15px] text-[#A09E97]">Add garment photo(s) — clothing product images</span>
            </button>
            {garmentFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {garmentFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    <Img
                      src={URL.createObjectURL(f)}
                      alt={`Garment ${i + 1}`}
                      className="rounded-lg object-cover w-14 h-14"
                    />
                    <button
                      type="button"
                      onClick={() => removeGarment(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#1A1915] text-[#A09E97] text-xs hover:text-[#F0EFE8] transition-colors"
                      style={{ border: '0.5px solid rgba(240,239,232,0.14)' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2.5">
              What do you want to swap?
            </label>
            <select
              value={swapTarget}
              onChange={(e) => setSwapTarget(e.target.value)}
              className="w-full rounded-[10px] py-3 px-4 text-[14px] text-[#F0EFE8] bg-[#222219] placeholder-[#65635D] transition-[border-color] duration-200 focus:outline-none focus:[border-color:rgba(240,239,232,0.28)]"
              style={{ border: '0.5px solid rgba(240,239,232,0.14)' }}
            >
              <option value="full_outfit">Full outfit (all clothes)</option>
              <option value="top">Top only (shirt, blouse, sweater)</option>
              <option value="bottom">Bottom only (pants, skirt, shorts)</option>
              <option value="dress">Dress / one piece</option>
              <option value="jacket">Jacket or coat</option>
              <option value="watch">Watch</option>
              <option value="glasses">Glasses or sunglasses</option>
              <option value="shoes">Shoes</option>
              <option value="hat">Hat or cap</option>
              <option value="bag">Bag or accessory</option>
              <option value="jewelry">Jewelry</option>
              <option value="other">Other (describe below)</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2.5">
              Item description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={swapTarget === 'other' ? 'e.g. scarf, belt, specific item' : 'e.g. white linen shirt'}
              className="w-full rounded-[10px] py-3 px-4 text-[14px] text-[#F0EFE8] bg-[#222219] placeholder-[#65635D] transition-[border-color] duration-200 focus:outline-none focus:[border-color:rgba(240,239,232,0.28)]"
              style={{ border: '0.5px solid rgba(240,239,232,0.14)' }}
            />
          </div>

          <p className="text-[12px] text-[#65635D] mb-6">
            Using your default resolution: <span className="font-medium text-[#A09E97]">{res}</span> (from Settings). {tierCredits(tier)} credit{tierCredits(tier) === 1 ? '' : 's'} per garment — {garmentFiles.length} garment{garmentFiles.length === 1 ? '' : 's'} = <span className="font-medium text-[#A09E97]">{tierCredits(tier) * garmentFiles.length}</span> credit{(tierCredits(tier) * garmentFiles.length) === 1 ? '' : 's'} total.
          </p>

          {error && (
            <div
              className="p-4 rounded-xl bg-[#2C2C27] text-[13px] text-[#D9714A]"
              style={{ border: '0.5px solid rgba(240,239,232,0.14)' }}
            >
              {error}
            </div>
          )}

          {(jobStatus === 'queued' || jobStatus === 'processing') && (
            <div className="mb-4 p-4 rounded-xl bg-[#2C2C27] border border-[rgba(240,239,232,0.08)]">
              {jobStatus === 'queued' && (
                <p className="text-[13px] text-[#A09E97]">
                  Job queued — position {queuePosition > 0 ? queuePosition : '…'} in queue. Polling for result…
                </p>
              )}
              {jobStatus === 'processing' && (
                <p className="text-[13px] text-[#A09E97]">
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2 align-middle" />
                  Generating your try-on… {elapsedSeconds > 0 && `${elapsedSeconds}s`}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !personFile || garmentFiles.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F0EFE8] text-[#1A1915] py-3 px-7 text-[14px] font-medium cursor-pointer border-0 transition-opacity duration-200 hover:opacity-[0.88] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {jobStatus ? (jobStatus === 'queued' ? 'Queued…' : 'Generating…') : 'Uploading…'}
              </>
            ) : (
              'Generate try-on'
            )}
          </button>
        </form>
      </GlassCard>

      {result && (
        <GlassCard
          className="pt-9 px-8 pb-10"
          style={{ borderWidth: '0.5px', backgroundColor: '#222219', borderColor: 'rgba(240,239,232,0.08)' }}
        >
          <h3
            className="text-[20px] font-normal tracking-[-0.02em] text-[#F0EFE8] mb-4"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Result
          </h3>
          <div className="flex flex-wrap gap-4">
            {result.output_urls.map((url, i) => (
              <ResultImage key={i} url={url} index={i} />
            ))}
          </div>
          <p className="text-[12px] text-[#65635D] mt-4">
            {result.credits_used} credit(s) used · {result.credits_remaining} remaining · {result.processing_time_ms}ms
          </p>
        </GlassCard>
      )}
    </div>
  );
}
