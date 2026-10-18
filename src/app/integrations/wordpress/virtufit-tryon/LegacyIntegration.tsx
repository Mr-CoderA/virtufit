import Link from 'next/link';
import { ArrowLeft, Package, Key, Code, Layout, Download } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

export default function IntegrationsWordPressVirtufitTryonPage() {
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
            <Package className="h-8 w-8 text-[var(--vf-accent)]" />
            WordPress & WooCommerce — VirtuFit Try-On
          </h1>
          <p className="mt-3 text-[15px] leading-[1.75] text-[var(--vf-muted)]">
            Add a “Try on” button on every WooCommerce product page. One button per product; works with simple and variable products.
          </p>
          <div className="mt-6 rounded-[12px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] px-4 py-3" style={{ borderWidth: '0.5px' }}>
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--vf-accent)] mb-1">Requirements</p>
            <p className="text-[14px] text-[var(--vf-muted)]">WordPress 5.0+, WooCommerce 6.0+, PHP 7.4+</p>
          </div>
          <a
            href="/api/downloads/virtufit-tryon"
            download="virtufit-tryon.zip"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--vf-ink)] text-[var(--vf-page)] px-6 py-3 text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4" />
            Download plugin zip
          </a>
        </header>

        <article className="space-y-10">
          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              What you get
            </h2>
            <ul className="list-disc list-inside space-y-1 text-[15px] text-[var(--vf-muted)]">
              <li>Paste your VirtuFit API key in <strong className="text-[var(--vf-ink)]">Settings → VirtuFit Try-On</strong> (in your WordPress admin sidebar, scroll to the bottom of the left menu to find Settings)</li>
              <li>A “Try on” button appears on every product page after Add to Cart</li>
              <li>For variable products, the garment image updates when the customer selects a variant</li>
              <li>Shortcode <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">[virtufit_tryon]</code> for non-WooCommerce pages</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <Key className="h-5 w-5 text-[var(--vf-accent)]" />
              Installation
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-[15px] text-[var(--vf-muted)]">
              <li><strong className="text-[var(--vf-ink)]">Download the plugin</strong> — Click the “Download plugin zip” button above to get <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">virtufit-tryon.zip</code>.</li>
              <li>In WordPress go to <strong className="text-[var(--vf-ink)]">Plugins → Add New → Upload</strong>. Choose the zip file you downloaded, then click <strong className="text-[var(--vf-ink)]">Install Now</strong> and <strong className="text-[var(--vf-ink)]">Activate</strong>.</li>
              <li>Go to <strong className="text-[var(--vf-ink)]">Settings → VirtuFit Try-On</strong>. In your WordPress admin sidebar, scroll to the bottom of the left menu to find <strong className="text-[var(--vf-ink)]">Settings</strong>.</li>
              <li>Paste your <strong className="text-[var(--vf-ink)]">API key</strong> from your VirtuFit dashboard. That’s all you need — the plugin uses the correct API URL automatically.</li>
              <li>Optionally choose <strong className="text-[var(--vf-ink)]">Quality</strong> (Fast / Standard / Best) and <strong className="text-[var(--vf-ink)]">What to try on</strong> (Full outfit, Top only, etc.).</li>
              <li>Click <strong className="text-[var(--vf-ink)]">Test connection</strong> to verify your API key (no credits used), then <strong className="text-[var(--vf-ink)]">Save settings</strong>.</li>
              <li>The Try On button will appear on product pages automatically.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <Layout className="h-5 w-5 text-[var(--vf-accent)]" />
              Shortcode (non-WooCommerce)
            </h2>
            <p className="text-[15px] text-[var(--vf-muted)] mb-2">
              Use the shortcode on any page or post when you’re not on a WooCommerce product:
            </p>
            <pre className="rounded-[12px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-4 font-mono text-[13px] text-[var(--vf-muted)] overflow-x-auto" style={{ borderWidth: '0.5px' }}>
{`[virtufit_tryon garment_url="https://yoursite.com/image.jpg" tier="basic" text="Try on"]`}
            </pre>
            <ul className="mt-3 space-y-1 text-[14px] text-[var(--vf-muted)]">
              <li><code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">garment_url</code> (required) — URL of the garment/product image</li>
              <li><code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">tier</code> — Quality: nano | basic | pro (default from settings)</li>
              <li><code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">swap_target</code> — Full outfit | Top only | Bottom only | etc. (same as “What to try on” in settings)</li>
              <li><code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">text</code> — Button label</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <Code className="h-5 w-5 text-[var(--vf-accent)]" />
              Technical notes
            </h2>
            <p className="text-[15px] text-[var(--vf-muted)]">
              The plugin enqueues the VirtuFit widget script only on product pages and on any page that contains the shortcode. Variable products: when the customer changes variant, the plugin updates the button’s <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">data-garment-url</code> to the selected variation image. The API URL is built into the plugin — store owners only need to paste their API key.
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
