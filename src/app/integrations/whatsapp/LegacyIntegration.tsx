import Link from 'next/link';
import { ArrowLeft, MessageCircle, Zap, FileCode } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { getBaseApiUrl } from '@/lib/base-api-url';

export default async function IntegrationsWhatsAppPage() {
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
            <MessageCircle className="h-8 w-8 text-[var(--vf-accent)]" />
            WhatsApp Business
          </h1>
          <p className="mt-3 text-[15px] leading-[1.75] text-[var(--vf-muted)]">
            For Pakistani and South Asian fashion brands that sell through WhatsApp. Customer sends a photo and product code/image; your webhook calls the VirtuFit API and sends the result image back in the same chat.
          </p>
        </header>

        <article className="space-y-10">
          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              What you need
            </h2>
            <ul className="list-disc list-inside space-y-1 text-[15px] text-[var(--vf-muted)]">
              <li>A VirtuFit account and API key</li>
              <li>A WhatsApp Business API number (see below)</li>
              <li>A server or serverless function to receive webhooks (Node.js template included)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Flow
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-[15px] text-[var(--vf-muted)]">
              <li>Customer sends a <strong className="text-[var(--vf-ink)]">photo</strong> (selfie/person image) to your WhatsApp number.</li>
              <li>Your webhook stores it and replies: “Send the product code or product image.”</li>
              <li>Customer sends a <strong className="text-[var(--vf-ink)]">product code</strong> (e.g. SKU-101) or <strong className="text-[var(--vf-ink)]">product image</strong>.</li>
              <li>Your webhook calls <code className="rounded bg-[var(--vf-surface-hover)] px-1.5 py-0.5 text-[13px] text-[var(--vf-muted)]">POST {baseUrl}/api/v1/generate</code> with <code className="rounded bg-[var(--vf-surface-hover)] px-1.5 py-0.5 text-[13px] text-[var(--vf-muted)]">X-API-Key</code>, gets the result URL.</li>
              <li>Your webhook sends the <strong className="text-[var(--vf-ink)]">result image</strong> back to the customer in the same chat.</li>
              <li>Errors are replied in English and Urdu (template includes both).</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Getting a WhatsApp Business API number
            </h2>
            <p className="mb-4 text-[15px] text-[var(--vf-muted)]">
              Use the <strong className="text-[var(--vf-ink)]">WhatsApp Cloud API</strong> (Meta) or a <strong className="text-[var(--vf-ink)]">BSP</strong> (e.g. Twilio).
            </p>
            <div className="space-y-4 rounded-[12px] border border-[rgba(21,43,67,0.14)] bg-[var(--vf-surface)] p-5" style={{ borderWidth: '0.5px' }}>
              <div>
                <p className="text-[13px] font-medium text-[var(--vf-accent)] mb-1">Option A — Meta (Facebook) directly</p>
                <ol className="list-decimal list-inside text-[14px] text-[var(--vf-muted)] space-y-1">
                  <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-[var(--vf-accent)] underline hover:text-[var(--vf-ink)]">developers.facebook.com</a> and create an app.</li>
                  <li>Add the <strong>WhatsApp</strong> product → API Setup for a test or production number.</li>
                  <li>Note <strong>Phone Number ID</strong>, <strong>WhatsApp Business Account ID</strong>, and <strong>Access Token</strong>.</li>
                  <li>Set the <strong>Webhook URL</strong> to your server (e.g. <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">https://your-server.com/webhooks/whatsapp</code>) and subscribe to <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">messages</code>.</li>
                </ol>
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--vf-accent)] mb-1">Option B — Twilio (or other BSP)</p>
                <p className="text-[14px] text-[var(--vf-muted)]">
                  Sign up at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-[var(--vf-accent)] underline hover:text-[var(--vf-ink)]">twilio.com</a>, enable WhatsApp, set the webhook URL for incoming messages. Use Twilio’s API to send replies; the Node.js template logic (session, VirtuFit call) stays the same.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Environment variables
            </h2>
            <p className="mb-2 text-[15px] text-[var(--vf-muted)]">Set these for the webhook handler:</p>
            <ul className="space-y-1 text-[14px] text-[var(--vf-muted)]">
              <li><code className="rounded bg-[var(--vf-surface-hover)] px-1.5 py-0.5 text-[var(--vf-muted)]">VIRTUFIT_BASE_URL</code> — e.g. {baseUrl || 'https://virtufit.xyz'}</li>
              <li><code className="rounded bg-[var(--vf-surface-hover)] px-1.5 py-0.5 text-[var(--vf-muted)]">VIRTUFIT_API_KEY</code> — your VirtuFit API key</li>
              <li><code className="rounded bg-[var(--vf-surface-hover)] px-1.5 py-0.5 text-[var(--vf-muted)]">WHATSAPP_ACCESS_TOKEN</code> — Meta WhatsApp access token</li>
              <li><code className="rounded bg-[var(--vf-surface-hover)] px-1.5 py-0.5 text-[var(--vf-muted)]">WHATSAPP_PHONE_NUMBER_ID</code> — Phone Number ID for sending</li>
              <li><code className="rounded bg-[var(--vf-surface-hover)] px-1.5 py-0.5 text-[var(--vf-muted)]">WEBHOOK_VERIFY_TOKEN</code> — secret for webhook verification (GET)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Webhook URL and verification
            </h2>
            <p className="mb-2 text-[15px] text-[var(--vf-muted)]">
              Meta requires verification: <strong>GET</strong> with <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">hub.mode=subscribe</code>, <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">hub.verify_token</code>, <code className="rounded bg-[var(--vf-surface-hover)] px-1 text-[var(--vf-muted)]">hub.challenge</code>. Respond with the challenge value if the token matches. The Node.js template includes this handler.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Session management
            </h2>
            <p className="text-[15px] text-[var(--vf-muted)]">
              The template uses in-memory sessions (customer ID → step + person image URL). Step 1: wait for person photo. Step 2: wait for product code or image. Step 3: call VirtuFit, send result. In production use Redis or a database.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Error messages (English and Urdu)
            </h2>
            <p className="mb-2 text-[15px] text-[var(--vf-muted)]">
              The template includes both languages, e.g. “Something went wrong. Please try again.” / “Kuch galat ho gaya. Dubara koshish karein.” and “Insufficient credits…” / “Credits khatam. Top up karein.”
            </p>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[18px] font-normal tracking-[-0.02em] text-[var(--vf-ink)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <FileCode className="h-5 w-5 text-[var(--vf-accent)]" />
              Node.js webhook template
            </h2>
            <p className="mb-3 text-[15px] text-[var(--vf-muted)]">
              The project includes a ready-to-use template in the repo at <code className="rounded bg-[var(--vf-surface-hover)] px-1.5 py-0.5 text-[13px] text-[var(--vf-muted)]">integrations/whatsapp/</code>: <strong className="text-[var(--vf-ink)]">webhook-handler.js</strong> (Express, Meta Cloud API, session management, VirtuFit call, EN/UR errors) and <strong className="text-[var(--vf-ink)]">README.md</strong>.
            </p>
            <p className="text-[14px] text-[var(--vf-muted)]">
              Run: <code className="rounded bg-[var(--vf-surface-hover)] px-2 py-1 text-[13px] text-[var(--vf-muted)]">npm install</code> in that folder, set env vars, then <code className="rounded bg-[var(--vf-surface-hover)] px-2 py-1 text-[13px] text-[var(--vf-muted)]">node webhook-handler.js</code>. Expose with HTTPS (e.g. ngrok) and set that URL as the webhook in Meta.
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
