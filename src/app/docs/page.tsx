import Link from 'next/link';
import { ArrowLeft, Key, Zap, FileImage, Code } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { getBaseApiUrl } from '@/lib/base-api-url';
import { DocsPlayground } from './DocsPlayground';

export default async function DocsPage() {
  const BASE = await getBaseApiUrl();
  return (
    <div className="min-h-screen bg-[#1A1915]">
      <main className="mx-auto max-w-[720px] px-6 py-12 md:px-10 md:py-16">
        <div className="mb-10">
          <ButtonLink
            href="/dashboard"
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to dashboard
          </ButtonLink>
        </div>

        <header className="mb-12">
          <p
            className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Documentation
          </p>
          <h1
            className="text-[32px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            VirtuFit API reference
          </h1>
          <p className="mt-3 text-[15px] leading-[1.75] text-[#A09E97]">
            Use the virtual try-on API to generate images of a person wearing your garment(s). Authenticate with an API key and send a person photo plus one or more garment images.
          </p>
        </header>

        <article className="space-y-12">
          {/* Base URL */}
          <section>
            <h2
              className="mb-4 text-[20px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Base URL
            </h2>
            <div
              className="rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] px-4 py-3 font-mono text-[14px] text-[#F0EFE8]"
              style={{ borderWidth: '0.5px' }}
            >
              {BASE}
            </div>
            <p className="mt-2 text-[14px] text-[#A09E97]">
              All endpoints are relative to this base. Production: <code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[13px] text-[#A09E97]">https://virtufit.xyz</code>. Local dev: <code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[13px] text-[#A09E97]">http://localhost:3000</code>.
            </p>
          </section>

          {/* Authentication */}
          <section>
            <h2
              className="mb-4 flex items-center gap-2 text-[20px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              <Key className="h-5 w-5 text-[#D9714A]" />
              Authentication
            </h2>
            <p className="mb-4 text-[15px] leading-[1.75] text-[#A09E97]">
              Send your API key in the <code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[13px] text-[#A09E97]">X-API-Key</code> header. Create and manage keys from the{' '}
              <Link href="/dashboard" className="text-[#D9714A] underline decoration-[#D9714A]/50 underline-offset-2 hover:text-[#F0EFE8]">
                Dashboard
              </Link>
              .
            </p>
            <div
              className="overflow-x-auto rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] px-4 py-3 font-mono text-[13px] text-[#A09E97]"
              style={{ borderWidth: '0.5px' }}
            >
              <span className="text-[#65635D]">X-API-Key:</span> <span className="text-[#F0EFE8]">your_api_key_here</span>
            </div>
          </section>

          {/* Generate endpoint */}
          <section>
            <h2
              className="mb-4 flex items-center gap-2 text-[20px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              <Zap className="h-5 w-5 text-[#D9714A]" />
              POST /api/v1/generate
            </h2>
            <p className="mb-4 text-[15px] leading-[1.75] text-[#A09E97]">
              Generate virtual try-on image(s): one person photo + one or more garment images. Each garment produces one output image. Credits are deducted per run (see Credits & tiers).
            </p>

            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Request
            </p>
            <ul className="mb-4 list-inside list-disc space-y-1 text-[14px] text-[#A09E97]">
              <li><strong className="text-[#F0EFE8]">Content-Type:</strong> <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">multipart/form-data</code></li>
            </ul>

            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Parameters
            </p>
            <div className="mb-4 overflow-x-auto rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219]" style={{ borderWidth: '0.5px' }}>
              <table className="w-full min-w-[480px] text-left text-[14px]">
                <thead>
                  <tr className="border-b border-[rgba(240,239,232,0.08)]" style={{ borderWidth: '0.5px' }}>
                    <th className="py-3 pl-4 font-medium text-[#F0EFE8]">Field</th>
                    <th className="py-3 pl-4 font-medium text-[#F0EFE8]">Type</th>
                    <th className="py-3 pl-4 font-medium text-[#F0EFE8]">Required</th>
                    <th className="py-3 pl-4 font-medium text-[#F0EFE8]">Description</th>
                  </tr>
                </thead>
                <tbody className="text-[#A09E97]">
                  <tr className="border-b border-[rgba(240,239,232,0.08)]" style={{ borderWidth: '0.5px' }}>
                    <td className="py-3 pl-4 font-mono text-[13px] text-[#F0EFE8]">person_image</td>
                    <td className="py-3 pl-4">File</td>
                    <td className="py-3 pl-4">Yes*</td>
                    <td className="py-3 pl-4">Person photo (JPEG, PNG, WebP; max 10MB). *Or use person_image_url.</td>
                  </tr>
                  <tr className="border-b border-[rgba(240,239,232,0.08)]" style={{ borderWidth: '0.5px' }}>
                    <td className="py-3 pl-4 font-mono text-[13px] text-[#F0EFE8]">person_image_url</td>
                    <td className="py-3 pl-4">String</td>
                    <td className="py-3 pl-4">No</td>
                    <td className="py-3 pl-4">URL of person image instead of uploading a file.</td>
                  </tr>
                  <tr className="border-b border-[rgba(240,239,232,0.08)]" style={{ borderWidth: '0.5px' }}>
                    <td className="py-3 pl-4 font-mono text-[13px] text-[#F0EFE8]">garment_image</td>
                    <td className="py-3 pl-4">File(s)</td>
                    <td className="py-3 pl-4">Yes*</td>
                    <td className="py-3 pl-4">One or more garment images (1–5 total). *Or use garment_urls.</td>
                  </tr>
                  <tr className="border-b border-[rgba(240,239,232,0.08)]" style={{ borderWidth: '0.5px' }}>
                    <td className="py-3 pl-4 font-mono text-[13px] text-[#F0EFE8]">garment_urls</td>
                    <td className="py-3 pl-4">String</td>
                    <td className="py-3 pl-4">No</td>
                    <td className="py-3 pl-4">Comma-separated URLs of garment images (max 5).</td>
                  </tr>
                  <tr className="border-b border-[rgba(240,239,232,0.08)]" style={{ borderWidth: '0.5px' }}>
                    <td className="py-3 pl-4 font-mono text-[13px] text-[#F0EFE8]">tier</td>
                    <td className="py-3 pl-4">String</td>
                    <td className="py-3 pl-4">No</td>
                    <td className="py-3 pl-4">One of: <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">nano</code>, <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">basic</code>, <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">pro</code>. Default: basic.</td>
                  </tr>
                  <tr className="border-b border-[rgba(240,239,232,0.08)]" style={{ borderWidth: '0.5px' }}>
                    <td className="py-3 pl-4 font-mono text-[13px] text-[#F0EFE8]">swap_target</td>
                    <td className="py-3 pl-4">String</td>
                    <td className="py-3 pl-4">No</td>
                    <td className="py-3 pl-4">What to swap: full_outfit, top, bottom, dress, jacket, watch, glasses, shoes, hat, bag, jewelry, other. Default: full_outfit.</td>
                  </tr>
                  <tr className="border-b border-[rgba(240,239,232,0.08)]" style={{ borderWidth: '0.5px' }}>
                    <td className="py-3 pl-4 font-mono text-[13px] text-[#F0EFE8]">garment_description</td>
                    <td className="py-3 pl-4">String</td>
                    <td className="py-3 pl-4">No</td>
                    <td className="py-3 pl-4">Optional text description of the garment (e.g. &quot;white linen shirt&quot;) to improve results.</td>
                  </tr>
                  <tr className="border-b border-[rgba(240,239,232,0.08)]" style={{ borderWidth: '0.5px' }}>
                    <td className="py-3 pl-4 font-mono text-[13px] text-[#F0EFE8]">webhook_url</td>
                    <td className="py-3 pl-4">String</td>
                    <td className="py-3 pl-4">No</td>
                    <td className="py-3 pl-4">HTTPS URL to POST completion/failure payload (retries with backoff).</td>
                  </tr>
                  <tr className="border-b border-[rgba(240,239,232,0.08)]" style={{ borderWidth: '0.5px' }}>
                    <td className="py-3 pl-4 font-mono text-[13px] text-[#F0EFE8]">webhook_secret</td>
                    <td className="py-3 pl-4">String</td>
                    <td className="py-3 pl-4">No</td>
                    <td className="py-3 pl-4">Optional secret to sign webhook body (X-VirtuFit-Signature: HMAC-SHA256).</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Async response (202 Accepted)
            </p>
            <p className="mb-2 text-[14px] text-[#A09E97]">
              When the job queue is available, the API returns <strong className="text-[#F0EFE8]">202 Accepted</strong> immediately. Poll <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">status_url</code> or provide <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">webhook_url</code> for the result.
            </p>
            <pre
              className="overflow-x-auto rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4 font-mono text-[13px] text-[#A09E97] mb-4"
              style={{ borderWidth: '0.5px' }}
            >
{`{
  "accepted": true,
  "job_id": "uuid",
  "status": "queued",
  "status_url": "${BASE}/api/v1/jobs/<job_id>",
  "message": "Generation queued. Poll status_url or provide webhook_url for callback.",
  "estimated_seconds": 15,
  "credits_reserved": false
}`}
            </pre>

            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Success response (200, sync fallback)
            </p>
            <pre
              className="overflow-x-auto rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4 font-mono text-[13px] text-[#A09E97]"
              style={{ borderWidth: '0.5px' }}
            >
{`{
  "success": true,
  "job_id": "abc123",
  "output_url": "https://...",
  "output_urls": ["https://...", "https://..."],
  "tier": "basic",
  "credits_used": 2,
  "credits_remaining": 48,
  "processing_time_ms": 12000
}`}
            </pre>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]">Response fields</p>
            <ul className="mt-1 text-[14px] text-[#A09E97] space-y-1">
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">success</code> — true on success (200)</li>
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">job_id</code> — unique job identifier</li>
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">output_url</code> — first result image URL</li>
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">output_urls</code> — array of all result image URLs (one per garment)</li>
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">tier</code> — tier used</li>
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">credits_used</code> — credits deducted</li>
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">credits_remaining</code> — balance after request</li>
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">processing_time_ms</code> — total time in milliseconds</li>
            </ul>

            <p className="mt-6 mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Async flow & job status
            </p>
            <p className="mb-2 text-[14px] text-[#A09E97]">
              1. POST <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">/api/v1/generate</code> → returns 202 + <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">job_id</code> and <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">status_url</code>. 2. Poll GET <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">/api/v1/jobs/:jobId</code> every 2–5 seconds (same X-API-Key or session), or provide <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">webhook_url</code> to receive the result automatically. 3. When <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">status</code> is <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">completed</code>, use <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">output_urls</code>.
            </p>
            <p className="text-[12px] text-[#65635D]">
              Best practice: use <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">webhook_url</code> for server-side integrations (more reliable than polling). Poll no faster than every 2 seconds. Job status is available for 24 hours.
            </p>
          </section>

          {/* Rate limits */}
          <section>
            <h2 className="mb-4 text-[20px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Rate limits
            </h2>
            <p className="text-[15px] text-[#A09E97]">
              Multiple garments in one request are processed sequentially with a short delay between runs. Avoid sending many concurrent requests; typical limits are on the order of a few requests per minute per account. For high volume, space out requests or contact support.
            </p>
          </section>

          {/* Example requests */}
          <section>
            <h2 className="mb-4 text-[20px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Example requests
            </h2>
            <p className="text-[14px] text-[#A09E97] mb-4">Replace <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">YOUR_API_KEY</code> and file paths as needed.</p>

            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-1">cURL</p>
            <pre className="overflow-x-auto rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4 font-mono text-[12px] text-[#A09E97] mb-4 whitespace-pre-wrap break-all" style={{ borderWidth: '0.5px' }}>
{`curl -X POST "${BASE}/api/v1/generate" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "person_image=@/path/to/photo.jpg" \\
  -F "garment_image=@/path/to/garment.jpg" \\
  -F "tier=basic" \\
  -F "swap_target=full_outfit"`}
            </pre>

            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-1">JavaScript (fetch)</p>
            <pre className="overflow-x-auto rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4 font-mono text-[12px] text-[#A09E97] mb-4 whitespace-pre-wrap break-all" style={{ borderWidth: '0.5px' }}>
{`const form = new FormData();
form.append('person_image', personFile);
form.append('garment_image', garmentFile);
form.append('tier', 'basic');
form.append('swap_target', 'full_outfit');

const res = await fetch('${BASE}/api/v1/generate', {
  method: 'POST',
  headers: { 'X-API-Key': 'YOUR_API_KEY' },
  body: form,
});
const data = await res.json();`}
            </pre>

            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-1">Python</p>
            <pre className="overflow-x-auto rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4 font-mono text-[12px] text-[#A09E97] mb-4 whitespace-pre-wrap break-all" style={{ borderWidth: '0.5px' }}>
{`import requests

url = "${BASE}/api/v1/generate"
headers = {"X-API-Key": "YOUR_API_KEY"}
files = {
    "person_image": open("/path/to/photo.jpg", "rb"),
    "garment_image": open("/path/to/garment.jpg", "rb"),
}
data = {"tier": "basic", "swap_target": "full_outfit"}

r = requests.post(url, headers=headers, files=files, data=data)
print(r.json())`}
            </pre>

            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-1">PHP</p>
            <pre className="overflow-x-auto rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4 font-mono text-[12px] text-[#A09E97] mb-4 whitespace-pre-wrap break-all" style={{ borderWidth: '0.5px' }}>
{`$ch = curl_init('${BASE}/api/v1/generate');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['X-API-Key: YOUR_API_KEY'],
    CURLOPT_POSTFIELDS => [
        'person_image' => new CURLFile('/path/to/photo.jpg'),
        'garment_image' => new CURLFile('/path/to/garment.jpg'),
        'tier' => 'basic',
        'swap_target' => 'full_outfit',
    ],
    CURLOPT_RETURNTRANSFER => true,
]);
$response = curl_exec($ch);
$data = json_decode($response, true);`}
            </pre>
          </section>

          {/* Error codes */}
          <section>
            <h2
              className="mb-4 text-[20px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Error codes
            </h2>
            <div className="space-y-3">
              {[
                { status: 401, text: 'Invalid or missing API key' },
                { status: 402, text: 'Insufficient credits (response includes required and balance)' },
                { status: 413, text: 'File too large (max 10MB per file)' },
                { status: 415, text: 'Unsupported file type (use JPEG, PNG, or WebP)' },
                { status: 422, text: 'Validation failed (missing/invalid fields; see details in body)' },
                { status: 500, text: 'Generation failed or upload failed (retryable)' },
                { status: 504, text: 'Generation timed out (retryable)' },
              ].map(({ status, text }) => (
                <div
                  key={status}
                  className="flex items-baseline gap-3 rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] px-4 py-3"
                  style={{ borderWidth: '0.5px' }}
                >
                  <span className="font-mono text-[13px] font-medium text-[#D9714A]">{status}</span>
                  <span className="text-[14px] text-[#A09E97]">{text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Credits & tiers */}
          <section>
            <h2
              className="mb-4 flex items-center gap-2 text-[20px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              <FileImage className="h-5 w-5 text-[#D9714A]" />
              Credits & tiers
            </h2>
            <p className="mb-4 text-[15px] leading-[1.75] text-[#A09E97]">
              Each generation run consumes credits based on tier. One garment = one run. Multiple garments in a single request are charged per garment.
            </p>
            <ul className="space-y-2 text-[14px] text-[#A09E97]">
              <li><strong className="text-[#F0EFE8]">nano</strong> — 1 credit per run (lower resolution)</li>
              <li><strong className="text-[#F0EFE8]">basic</strong> — 1 credit per run (1K)</li>
              <li><strong className="text-[#F0EFE8]">pro</strong> — 3 credits per run (2K)</li>
            </ul>
            <p className="mt-3 text-[12px] text-[#65635D]">
              Example: 1 person + 3 garments with <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">tier=basic</code> = 3 credits. With <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">tier=pro</code> = 9 credits.
            </p>
          </section>

          {/* Swap targets */}
          <section>
            <h2
              className="mb-4 text-[20px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Swap targets
            </h2>
            <p className="mb-4 text-[15px] leading-[1.75] text-[#A09E97]">
              Use <code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[13px] text-[#A09E97]">swap_target</code> to tell the model what to replace: full outfit, only the top, only a watch, glasses, shoes, etc. This improves accuracy.
            </p>
            <div className="flex flex-wrap gap-2">
              {['full_outfit', 'top', 'bottom', 'dress', 'jacket', 'watch', 'glasses', 'shoes', 'hat', 'bag', 'jewelry', 'other'].map((t) => (
                <code
                  key={t}
                  className="rounded-lg border border-[rgba(240,239,232,0.08)] bg-[#222219] px-3 py-1.5 font-mono text-[12px] text-[#A09E97]"
                  style={{ borderWidth: '0.5px' }}
                >
                  {t}
                </code>
              ))}
            </div>
          </section>

          {/* Webhook */}
          <section>
            <h2
              className="mb-4 flex items-center gap-2 text-[20px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              <Code className="h-5 w-5 text-[#D9714A]" />
              Webhook
            </h2>
            <p className="mb-4 text-[15px] leading-[1.75] text-[#A09E97]">
              If you pass <code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[13px] text-[#A09E97]">webhook_url</code>, we POST JSON when the job completes or fails. We retry up to 3 times with exponential backoff (5s, 25s, 125s). Optional <code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[#A09E97]">webhook_secret</code> signs the body (header <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">X-VirtuFit-Signature</code>: HMAC-SHA256).
            </p>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Success payload
            </p>
            <pre
              className="overflow-x-auto rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4 font-mono text-[13px] text-[#A09E97] mb-2"
              style={{ borderWidth: '0.5px' }}
            >
{`{
  "event": "tryon.completed",
  "job_id": "...",
  "status": "completed",
  "output_urls": ["https://..."],
  "output_url": "https://...",
  "tier": "basic",
  "credits_used": 1,
  "credits_remaining": 148,
  "processing_ms": 14200,
  "timestamp": "2026-03-15T..."
}`}
            </pre>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Failure payload
            </p>
            <pre
              className="overflow-x-auto rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4 font-mono text-[13px] text-[#A09E97]"
              style={{ borderWidth: '0.5px' }}
            >
{`{
  "event": "tryon.failed",
  "job_id": "...",
  "status": "failed",
  "error": "Replicate API error: ...",
  "credits_used": 0,
  "attempts": 3,
  "timestamp": "2026-03-15T..."
}`}
            </pre>
          </section>

          {/* Live playground */}
          <DocsPlayground baseUrl={BASE} />
        </article>

        <footer className="mt-16 border-t border-[rgba(240,239,232,0.08)] pt-8" style={{ borderWidth: '0.5px' }}>
          <p className="text-[13px] text-[#65635D]">
            Need help? Try the <Link href="/dashboard/demo" className="text-[#D9714A] underline decoration-[#D9714A]/50 underline-offset-2 hover:text-[#F0EFE8]">Integrate demo</Link> or manage your API keys and credits from the <Link href="/dashboard" className="text-[#D9714A] underline decoration-[#D9714A]/50 underline-offset-2 hover:text-[#F0EFE8]">Dashboard</Link>.
          </p>
        </footer>
      </main>
    </div>
  );
}
