import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Key, Code, FileCode } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { getBaseApiUrl } from '@/lib/base-api-url';

export default async function IntegrationsShopifyPage() {
  const baseUrl = await getBaseApiUrl();

  return (
    <div className="min-h-screen bg-[var(--vf-page)]">
      <main className="mx-auto max-w-[720px] px-6 py-12 md:px-10 md:py-16">
        <div className="mb-8">
          <ButtonLink href="/dashboard/integrate" variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Integrate
          </ButtonLink>
        </div>

        <header className="mb-10">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--vf-accent)]" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Integration guide
          </p>
          <h1
            className="flex items-center gap-3 text-[28px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            <ShoppingBag className="h-8 w-8 text-[var(--vf-accent)]" />
            Shopify
          </h1>
          <p className="mt-3 text-[15px] leading-[1.75] text-[var(--vf-muted)]">
            Add VirtuFit virtual try-on to your Shopify store in under 10 minutes. No coding experience required.
          </p>
        </header>

        <article className="space-y-10">
          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              What you need
            </h2>
            <ul className="list-disc list-inside space-y-1 text-[15px] text-[var(--vf-muted)]">
              <li>A Shopify store (any plan)</li>
              <li>A VirtuFit account and API key — <Link href="/dashboard/api-keys" className="text-[var(--vf-accent)] underline hover:text-[var(--vf-ink)]">get one from the dashboard</Link></li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <Key className="h-5 w-5 text-[var(--vf-accent)]" />
              Step 1 — Get your API key
            </h2>
            <p className="text-[15px] text-[var(--vf-muted)] mb-2">
              Copy the key from your VirtuFit dashboard. You can view it again anytime in Settings.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Step 2 — Store the API key in Shopify (recommended)
            </h2>
            <p className="text-[15px] text-[var(--vf-muted)] mb-3">
              So the key is not hardcoded in your theme: Shopify Admin → Settings → Custom data → Metafields. Under <strong className="text-[var(--vf-ink)]">Shop</strong>, Add definition:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[14px] text-[var(--vf-muted)] mb-3">
              <li><strong className="text-[var(--vf-ink)]">Name:</strong> VirtuFit API key</li>
              <li><strong className="text-[var(--vf-ink)]">Namespace and key:</strong> <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">custom.virtufit_api_key</code></li>
              <li><strong className="text-[var(--vf-ink)]">Type:</strong> Single line text</li>
            </ul>
            <p className="text-[15px] text-[var(--vf-muted)]">
              Save, then open Shop metafields and paste your API key into VirtuFit API key.
            </p>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <Code className="h-5 w-5 text-[var(--vf-accent)]" />
              Step 3 — Add the VirtuFit script
            </h2>
            <p className="text-[15px] text-[var(--vf-muted)] mb-2">
              Online Store → Themes → Actions → Edit code. Open <strong className="text-[var(--vf-ink)]">Layout → theme.liquid</strong>. Just above <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">&lt;/body&gt;</code>, add:
            </p>
            <pre className="rounded-[12px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-4 font-mono text-[13px] text-[var(--vf-muted)] overflow-x-auto whitespace-pre-wrap break-all" style={{ borderWidth: '0.5px' }}>
              {`<script src="${baseUrl}/widget/tryon.js" data-base="${baseUrl}"></script>`}
            </pre>
            <p className="text-[14px] text-[var(--vf-quiet)] mt-2">Replace the URL with your VirtuFit app URL if different.</p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Step 4 — Create the VirtuFit button snippet
            </h2>
            <p className="text-[15px] text-[var(--vf-muted)] mb-3">
              In Edit code, click <strong className="text-[var(--vf-ink)]">Add a new snippet</strong>. Name it <code className="rounded bg-[var(--vf-surface-hover)] px-1.5 py-0.5 text-[var(--vf-muted)]">virtufit-tryon</code>. Copy the code below and paste it into the snippet. It uses your product’s featured image and the API key from your shop metafield. Save.
            </p>
            <pre className="rounded-[12px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-4 font-mono text-[12px] text-[var(--vf-muted)] overflow-x-auto whitespace-pre-wrap" style={{ borderWidth: '0.5px' }}>
{`{% comment %}
  VirtuFit Virtual Try-On — paste this into a snippet file: snippets/virtufit-tryon.liquid
  Then in your product template add: {% render 'virtufit-tryon', product: product %}
{% endcomment %}
{% assign vf_api_key = api_key | default: shop.metafields.custom.virtufit_api_key %}
{% if vf_api_key != blank and product.featured_image %}
  <div class="virtufit-tryon-wrapper" style="margin-top: 1rem;">
    <button
      type="button"
      data-virtufit-btn
      data-api-key="{{ vf_api_key }}"
      data-garment-url="{{ product.featured_image | image_url: width: 1024 }}"
      data-tier="{{ tier | default: 'basic' }}"
      data-swap-target="{{ swap_target | default: 'full_outfit' }}"
    >
      {{ button_text | default: 'Try on' }}
    </button>
  </div>
{% endif %}`}
            </pre>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Step 5 — Show the button on the product page
            </h2>
            <p className="text-[15px] text-[var(--vf-muted)] mb-2">
              Open the file that controls the product layout (e.g. <strong className="text-[var(--vf-ink)]">Sections → main-product.liquid</strong> or <strong className="text-[var(--vf-ink)]">Templates → product.liquid</strong>). Where you want the button (e.g. after Add to cart), add:
            </p>
            <pre className="rounded-[12px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-4 font-mono text-[13px] text-[var(--vf-muted)] overflow-x-auto" style={{ borderWidth: '0.5px' }}>
              {`{% render 'virtufit-tryon', product: product %}`}
            </pre>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Step 6 — Test
            </h2>
            <p className="text-[15px] text-[var(--vf-muted)] mb-2">
              Open a product with a featured image on your storefront. You should see a <strong className="text-[var(--vf-ink)]">Try on</strong> button. Click it, upload a photo, and run a try-on.
            </p>
            <p className="text-[15px] text-[var(--vf-muted)] mb-2">
              If the button does not appear or something breaks: check the script in theme.liquid, snippet name, product featured image, and that the shop metafield is set. Open the <strong className="text-[var(--vf-ink)]">browser console</strong> (press <strong className="text-[var(--vf-ink)]">F12</strong>, then open the “Console” tab) and look for red error messages — that’s the fastest way to see what went wrong.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Button appearance
            </h2>
            <p className="text-[15px] text-[var(--vf-muted)]">
              The Try on button inherits your store’s existing button styles by default. To change how it looks, add CSS targeting <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">.virtufit-tryon-wrapper</code> or the button inside it in your theme.
            </p>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <FileCode className="h-5 w-5 text-[var(--vf-accent)]" />
              Optional: Theme App Extension (Online Store 2.0)
            </h2>
            <p className="text-[15px] text-[var(--vf-muted)]">
              Create an app in Shopify Partners with a Theme app extension. Add a block merchants can enable on the product page; use the same script and button logic with the block’s product and API key from block settings. See <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">integrations/shopify/app-proxy-config.md</code> for optional App Proxy setup.
            </p>
          </section>
        </article>

        <footer className="mt-12 border-t border-[rgba(21,43,67,0.14)] pt-6" style={{ borderWidth: '0.5px' }}>
          <p className="text-[13px] text-[var(--vf-quiet)]">
            <Link href="/dashboard/integrate" className="text-[var(--vf-accent)] underline underline-offset-2 hover:text-[var(--vf-ink)]">← Integrate hub</Link>
            {' · '}
            <Link href="/docs" className="text-[var(--vf-accent)] underline underline-offset-2 hover:text-[var(--vf-ink)]">API docs</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
