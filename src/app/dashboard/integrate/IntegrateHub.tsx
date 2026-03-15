'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Eye, EyeOff, Zap } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { brandFetch } from '@/lib/brand-api';

const TABS = [
  { id: 'universal', label: 'Universal JS' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'wordpress', label: 'WordPress' },
  { id: 'rest', label: 'REST API' },
  { id: 'whatsapp', label: 'WhatsApp' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function CodeBlock({
  content,
  apiKey,
  baseUrl,
  onCopy,
}: {
  content: string;
  apiKey: string;
  baseUrl: string;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = content
    .replace(/\b__API_KEY__\b/g, apiKey || 'YOUR_API_KEY')
    .replace(/\b__BASE_URL__\b/g, baseUrl || 'https://virtufit-seven.vercel.app');

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text, onCopy]);

  return (
    <div className="relative group rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] overflow-hidden" style={{ borderWidth: '0.5px' }}>
      <pre className="p-4 pr-12 overflow-x-auto text-[13px] font-mono text-[#A09E97] whitespace-pre-wrap break-all">
        {text}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg bg-[#2C2C27] border border-[rgba(240,239,232,0.08)] text-[#A09E97] hover:text-[#F0EFE8] transition-colors"
        style={{ borderWidth: '0.5px' }}
        title="Copy"
      >
        {copied ? <Check className="h-4 w-4 text-[#D9714A]" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function IntegrateHub({ baseUrl }: { baseUrl: string }) {
  const toast = useToast();
  const [apiKey, setApiKey] = useState('');
  const [reveal, setReveal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('universal');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  const handleCopy = useCallback(() => {
    toast.success('Copied to clipboard');
  }, [toast]);

  const runTest = useCallback(async () => {
    if (!apiKey.trim()) {
      toast.error('Paste your API key above first');
      return;
    }
    setTestStatus('testing');
    const apiBase = typeof window !== 'undefined' ? window.location.origin : baseUrl;
    try {
      const res = await brandFetch(`${apiBase}/api/v1/ping`, {
        headers: { 'X-API-Key': apiKey.trim() },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setTestStatus('ok');
        toast.success(`Connected. ${data.credits} credits available.`);
      } else {
        setTestStatus('fail');
        toast.error(data.error || 'Connection failed');
      }
    } catch {
      setTestStatus('fail');
      toast.error('Network error');
    }
  }, [apiKey, baseUrl, toast]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <ButtonLink href="/dashboard" variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to dashboard
        </ButtonLink>
      </div>

      {/* API key */}
      <section className="rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] p-6" style={{ borderWidth: '0.5px' }}>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2" style={{ fontFamily: 'system-ui, sans-serif' }}>
          Your API key
        </p>
        <p className="text-[14px] text-[#A09E97] mb-4">
          Copy the key from your <Link href="/dashboard/api-keys" className="text-[#D9714A] underline underline-offset-2 hover:text-[#F0EFE8]">dashboard</Link>. You can view it again anytime in Settings. Paste it below and it will be pre-filled in every snippet.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type={reveal ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="vf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-[10px] border border-[rgba(240,239,232,0.14)] bg-[#1A1915] py-3 px-4 pr-20 text-[14px] text-[#F0EFE8] placeholder-[#65635D] focus:outline-none focus:border-[rgba(240,239,232,0.28)]"
              style={{ borderWidth: '0.5px' }}
            />
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#65635D] hover:text-[#A09E97]"
              title={reveal ? 'Hide' : 'Reveal'}
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              if (apiKey) {
                navigator.clipboard.writeText(apiKey);
                toast.success('API key copied');
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(240,239,232,0.14)] bg-[#2C2C27] px-4 py-2.5 text-[13px] font-medium text-[#F0EFE8] hover:opacity-90"
            style={{ borderWidth: '0.5px' }}
          >
            <Copy className="h-4 w-4" /> Copy
          </button>
          <button
            type="button"
            onClick={runTest}
            disabled={testStatus === 'testing' || !apiKey.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-[#F0EFE8] text-[#1A1915] px-4 py-2.5 text-[13px] font-medium hover:opacity-88 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            {testStatus === 'testing' ? 'Testing…' : testStatus === 'ok' ? 'Connected' : testStatus === 'fail' ? 'Failed' : 'Test connection'}
          </button>
        </div>
        {testStatus === 'ok' && (
          <p className="mt-3 text-[13px] text-[#6b9b6b]">✓ API key is valid. You can use the snippets below.</p>
        )}
        {testStatus === 'fail' && (
          <p className="mt-3 text-[13px] text-[#D9714A]">✗ Check your API key and try again.</p>
        )}
      </section>

      {/* Tabs */}
      <div className="border-b border-[rgba(240,239,232,0.08)]" style={{ borderWidth: '0.5px' }}>
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-3 text-[13px] font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-[#F0EFE8] border-[#D9714A]'
                  : 'text-[#A09E97] border-transparent hover:text-[#F0EFE8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="space-y-8">
        {activeTab === 'universal' && (
          <>
            <p className="text-[15px] text-[#A09E97]">
              Embed the widget on any website with one script tag and one button. The widget finds all elements with <code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[13px] text-[#A09E97]">data-virtufit-btn</code> and opens the try-on modal on click.
            </p>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2">Step 1 — Add the script</p>
              <p className="text-[14px] text-[#A09E97] mb-2">Place this before <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">&lt;/body&gt;</code>:</p>
              <CodeBlock
                content={`<script src="__BASE_URL__/widget/tryon.js" data-base="__BASE_URL__"></script>`}
                apiKey={apiKey}
                baseUrl={baseUrl}
                onCopy={handleCopy}
              />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2">Step 2 — Add a button per product</p>
              <p className="text-[14px] text-[#A09E97] mb-2">Use the product image URL as the garment. Replace the URL with your product image.</p>
              <CodeBlock
                content={`<button
  type="button"
  data-virtufit-btn
  data-api-key="__API_KEY__"
  data-garment-url="https://your-store.com/product-image.jpg"
  data-tier="basic"
>
  Try on
</button>`}
                apiKey={apiKey}
                baseUrl={baseUrl}
                onCopy={handleCopy}
              />
              <p className="text-[13px] text-[#65635D] mt-2">The button uses your page’s default button styles. You can customize it with CSS (e.g. target the button or wrap it in a class).</p>
            </div>
          </>
        )}

        {activeTab === 'shopify' && (
          <>
            <p className="text-[15px] text-[#A09E97]">
              Add the script in your theme and a Liquid snippet in the product template. Store your API key in a metafield so it is not hardcoded.{' '}
              <Link href="/integrations/shopify" className="text-[#D9714A] underline underline-offset-2 hover:text-[#F0EFE8]">Full Shopify guide →</Link>
            </p>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2">Step 1 — Theme Liquid</p>
              <p className="text-[14px] text-[#A09E97] mb-2">In <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">theme.liquid</code>, before <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">&lt;/body&gt;</code>:</p>
              <CodeBlock
                content={`<script src="__BASE_URL__/widget/tryon.js" data-base="__BASE_URL__"></script>`}
                apiKey={apiKey}
                baseUrl={baseUrl}
                onCopy={handleCopy}
              />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2">Step 2 — Product snippet</p>
              <p className="text-[14px] text-[#A09E97] mb-2">Create a snippet (e.g. <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">virtufit-tryon.liquid</code>) and include it in your product template. The snippet uses the product featured image and API key from metafield <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">custom.virtufit_api_key</code>.</p>
              <CodeBlock
                content={`<button type="button"
  data-virtufit-btn
  data-api-key="{{ shop.metafields.custom.virtufit_api_key | default: '__API_KEY__' }}"
  data-garment-url="{{ product.featured_image | image_url: width: 1024 }}"
  data-tier="basic">
  Try on
</button>`}
                apiKey={apiKey}
                baseUrl={baseUrl}
                onCopy={handleCopy}
              />
            </div>
            <p className="text-[13px] text-[#65635D]">
              <Link href="/integrations/shopify" className="text-[#D9714A] underline underline-offset-2 hover:text-[#F0EFE8]">View full Shopify integration guide</Link> for metafield setup and App Proxy.
            </p>
          </>
        )}

        {activeTab === 'wordpress' && (
          <>
            <p className="text-[15px] text-[#A09E97]">
              Install the VirtuFit plugin (zip the <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">virtufit-tryon</code> folder). The plugin adds a Try On button on WooCommerce product pages and provides a shortcode.{' '}
              <Link href="/integrations/wordpress/virtufit-tryon" className="text-[#D9714A] underline underline-offset-2 hover:text-[#F0EFE8]">Full WordPress guide →</Link>
            </p>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2">Step 1 — Install plugin</p>
              <p className="text-[14px] text-[#A09E97] mb-2">Zip the <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">virtufit-tryon</code> folder, upload in WordPress → Plugins → Add New → Upload, then activate.</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2">Step 2 — Settings</p>
              <p className="text-[14px] text-[#A09E97] mb-2">Go to Settings → VirtuFit Try-On. Paste your API key, choose tier, and use the Test button to verify.</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2">Shortcode (non-WooCommerce)</p>
              <CodeBlock
                content={`[virtufit_tryon garment_url="https://yoursite.com/image.jpg" tier="basic"]`}
                apiKey={apiKey}
                baseUrl={baseUrl}
                onCopy={handleCopy}
              />
            </div>
            <p className="text-[13px] text-[#65635D]">
              <Link href="/integrations/wordpress/virtufit-tryon" className="text-[#D9714A] underline underline-offset-2 hover:text-[#F0EFE8]">View full WordPress & WooCommerce guide</Link> for installation and shortcode.
            </p>
          </>
        )}

        {activeTab === 'rest' && (
          <>
            <p className="text-[15px] text-[#A09E97]">
              Call the REST API directly from your backend or any HTTP client. Full reference: <Link href="/docs" className="text-[#D9714A] underline underline-offset-2 hover:text-[#F0EFE8]">View Docs</Link>.
            </p>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2">Endpoint</p>
              <CodeBlock
                content={`POST __BASE_URL__/api/v1/generate
Content-Type: multipart/form-data
X-API-Key: __API_KEY__`}
                apiKey={apiKey}
                baseUrl={baseUrl}
                onCopy={handleCopy}
              />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2">cURL example</p>
              <CodeBlock
                content={`curl -X POST "__BASE_URL__/api/v1/generate" \\
  -H "X-API-Key: __API_KEY__" \\
  -F "person_image=@/path/to/photo.jpg" \\
  -F "garment_image=@/path/to/garment.jpg" \\
  -F "tier=basic" \\
  -F "swap_target=full_outfit"`}
                apiKey={apiKey}
                baseUrl={baseUrl}
                onCopy={handleCopy}
              />
            </div>
            <p className="text-[13px] text-[#65635D]">
              Test without consuming credits: <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">GET {baseUrl}/api/v1/ping</code> with <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">X-API-Key</code>.
            </p>
          </>
        )}

        {activeTab === 'whatsapp' && (
          <>
            <p className="text-[15px] text-[#A09E97]">
              For WhatsApp Business: customer sends a photo and product code/image; your webhook calls the VirtuFit API and sends the result back.{' '}
              <Link href="/integrations/whatsapp" className="text-[#D9714A] underline underline-offset-2 hover:text-[#F0EFE8]">
                Full guide and Node.js webhook template →
              </Link>
            </p>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-2">Flow</p>
              <ol className="list-decimal list-inside space-y-2 text-[14px] text-[#A09E97]">
                <li>Customer sends their photo to your WhatsApp number.</li>
                <li>Customer sends product code or product image.</li>
                <li>Your webhook receives the messages, calls <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">POST /api/v1/generate</code> with <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">X-API-Key: __API_KEY__</code>.</li>
                <li>Webhook sends the result image back to the customer in the same chat.</li>
              </ol>
            </div>
            <p className="text-[13px] text-[#65635D]">
              <Link href="/integrations/whatsapp" className="text-[#D9714A] underline underline-offset-2 hover:text-[#F0EFE8]">View full WhatsApp integration guide</Link> for setup, env vars, Meta/Twilio, and webhook URL configuration.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
