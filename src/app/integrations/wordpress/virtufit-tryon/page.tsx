import Link from 'next/link';
import { ArrowLeft, Package, Key, Code, Layout, Download } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

export default function IntegrationsWordPressVirtufitTryonPage() {
  return (
    <div className="min-h-screen bg-[#1A1915]">
      <main className="mx-auto max-w-[720px] px-6 py-12 md:px-10 md:py-16">
        <div className="mb-8">
          <ButtonLink href="/dashboard/integrate" variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Integrate
          </ButtonLink>
        </div>

        <header className="mb-10">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Integration guide
          </p>
          <h1
            className="flex items-center gap-3 text-[28px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            <Package className="h-8 w-8 text-[#D9714A]" />
            WordPress & WooCommerce — VirtuFit Try-On
          </h1>
          <p className="mt-3 text-[15px] leading-[1.75] text-[#A09E97]">
            Add a “Try on” button on every WooCommerce product page. One button per product; works with simple and variable products.
          </p>
          <div className="mt-6 rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] px-4 py-3" style={{ borderWidth: '0.5px' }}>
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A] mb-1">Requirements</p>
            <p className="text-[14px] text-[#A09E97]">WordPress 5.0+, WooCommerce 6.0+, PHP 7.4+</p>
          </div>
          <a
            href="/api/downloads/virtufit-tryon"
            download="virtufit-tryon.zip"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F0EFE8] text-[#1A1915] px-6 py-3 text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4" />
            Download plugin zip
          </a>
        </header>

        <article className="space-y-10">
          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              What you get
            </h2>
            <ul className="list-disc list-inside space-y-1 text-[15px] text-[#A09E97]">
              <li>Paste your VirtuFit API key in <strong className="text-[#F0EFE8]">Settings → VirtuFit Try-On</strong> (in your WordPress admin sidebar, scroll to the bottom of the left menu to find Settings)</li>
              <li>A “Try on” button appears on every product page after Add to Cart</li>
              <li>For variable products, the garment image updates when the customer selects a variant</li>
              <li>Shortcode <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">[virtufit_tryon]</code> for non-WooCommerce pages</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <Key className="h-5 w-5 text-[#D9714A]" />
              Installation
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-[15px] text-[#A09E97]">
              <li><strong className="text-[#F0EFE8]">Download the plugin</strong> — Click the “Download plugin zip” button above to get <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">virtufit-tryon.zip</code>.</li>
              <li>In WordPress go to <strong className="text-[#F0EFE8]">Plugins → Add New → Upload</strong>. Choose the zip file you downloaded, then click <strong className="text-[#F0EFE8]">Install Now</strong> and <strong className="text-[#F0EFE8]">Activate</strong>.</li>
              <li>Go to <strong className="text-[#F0EFE8]">Settings → VirtuFit Try-On</strong>. In your WordPress admin sidebar, scroll to the bottom of the left menu to find <strong className="text-[#F0EFE8]">Settings</strong>.</li>
              <li>Paste your <strong className="text-[#F0EFE8]">API key</strong> from your VirtuFit dashboard. That’s all you need — the plugin uses the correct API URL automatically.</li>
              <li>Optionally choose <strong className="text-[#F0EFE8]">Quality</strong> (Fast / Standard / Best) and <strong className="text-[#F0EFE8]">What to try on</strong> (Full outfit, Top only, etc.).</li>
              <li>Click <strong className="text-[#F0EFE8]">Test connection</strong> to verify your API key (no credits used), then <strong className="text-[#F0EFE8]">Save settings</strong>.</li>
              <li>The Try On button will appear on product pages automatically.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <Layout className="h-5 w-5 text-[#D9714A]" />
              Shortcode (non-WooCommerce)
            </h2>
            <p className="text-[15px] text-[#A09E97] mb-2">
              Use the shortcode on any page or post when you’re not on a WooCommerce product:
            </p>
            <pre className="rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] p-4 font-mono text-[13px] text-[#A09E97] overflow-x-auto" style={{ borderWidth: '0.5px' }}>
{`[virtufit_tryon garment_url="https://yoursite.com/image.jpg" tier="basic" text="Try on"]`}
            </pre>
            <ul className="mt-3 space-y-1 text-[14px] text-[#A09E97]">
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">garment_url</code> (required) — URL of the garment/product image</li>
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">tier</code> — Quality: nano | basic | pro (default from settings)</li>
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">swap_target</code> — Full outfit | Top only | Bottom only | etc. (same as “What to try on” in settings)</li>
              <li><code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">text</code> — Button label</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <Code className="h-5 w-5 text-[#D9714A]" />
              Technical notes
            </h2>
            <p className="text-[15px] text-[#A09E97]">
              The plugin enqueues the VirtuFit widget script only on product pages and on any page that contains the shortcode. Variable products: when the customer changes variant, the plugin updates the button’s <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">data-garment-url</code> to the selected variation image. The API URL is built into the plugin — store owners only need to paste their API key.
            </p>
          </section>
        </article>

        <footer className="mt-12 border-t border-[rgba(240,239,232,0.08)] pt-6" style={{ borderWidth: '0.5px' }}>
          <p className="text-[13px] text-[#65635D]">
            <Link href="/dashboard/integrate" className="text-[#D9714A] underline underline-offset-2 hover:text-[#F0EFE8]">← Integrate hub</Link>
            {' · '}
            <Link href="/docs" className="text-[#D9714A] underline underline-offset-2 hover:text-[#F0EFE8]">API docs</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
