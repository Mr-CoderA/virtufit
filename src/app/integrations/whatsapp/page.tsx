import Link from 'next/link';
import { ArrowLeft, MessageCircle, Zap, FileCode } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { getBaseApiUrl } from '@/lib/base-api-url';

export default async function IntegrationsWhatsAppPage() {
  const baseUrl = await getBaseApiUrl();

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
            <MessageCircle className="h-8 w-8 text-[#D9714A]" />
            WhatsApp Business
          </h1>
          <p className="mt-3 text-[15px] leading-[1.75] text-[#A09E97]">
            For Pakistani and South Asian fashion brands that sell through WhatsApp. Customer sends a photo and product code/image; your webhook calls the VirtuFit API and sends the result image back in the same chat.
          </p>
        </header>

        <article className="space-y-10">
          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              What you need
            </h2>
            <ul className="list-disc list-inside space-y-1 text-[15px] text-[#A09E97]">
              <li>A VirtuFit account and API key</li>
              <li>A WhatsApp Business API number (see below)</li>
              <li>A server or serverless function to receive webhooks (Node.js template included)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Flow
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-[15px] text-[#A09E97]">
              <li>Customer sends a <strong className="text-[#F0EFE8]">photo</strong> (selfie/person image) to your WhatsApp number.</li>
              <li>Your webhook stores it and replies: “Send the product code or product image.”</li>
              <li>Customer sends a <strong className="text-[#F0EFE8]">product code</strong> (e.g. SKU-101) or <strong className="text-[#F0EFE8]">product image</strong>.</li>
              <li>Your webhook calls <code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[13px] text-[#A09E97]">POST {baseUrl}/api/v1/generate</code> with <code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[13px] text-[#A09E97]">X-API-Key</code>, gets the result URL.</li>
              <li>Your webhook sends the <strong className="text-[#F0EFE8]">result image</strong> back to the customer in the same chat.</li>
              <li>Errors are replied in English and Urdu (template includes both).</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Getting a WhatsApp Business API number
            </h2>
            <p className="mb-4 text-[15px] text-[#A09E97]">
              Use the <strong className="text-[#F0EFE8]">WhatsApp Cloud API</strong> (Meta) or a <strong className="text-[#F0EFE8]">BSP</strong> (e.g. Twilio).
            </p>
            <div className="space-y-4 rounded-[12px] border border-[rgba(240,239,232,0.08)] bg-[#222219] p-5" style={{ borderWidth: '0.5px' }}>
              <div>
                <p className="text-[13px] font-medium text-[#D9714A] mb-1">Option A — Meta (Facebook) directly</p>
                <ol className="list-decimal list-inside text-[14px] text-[#A09E97] space-y-1">
                  <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#D9714A] underline hover:text-[#F0EFE8]">developers.facebook.com</a> and create an app.</li>
                  <li>Add the <strong>WhatsApp</strong> product → API Setup for a test or production number.</li>
                  <li>Note <strong>Phone Number ID</strong>, <strong>WhatsApp Business Account ID</strong>, and <strong>Access Token</strong>.</li>
                  <li>Set the <strong>Webhook URL</strong> to your server (e.g. <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">https://your-server.com/webhooks/whatsapp</code>) and subscribe to <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">messages</code>.</li>
                </ol>
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#D9714A] mb-1">Option B — Twilio (or other BSP)</p>
                <p className="text-[14px] text-[#A09E97]">
                  Sign up at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-[#D9714A] underline hover:text-[#F0EFE8]">twilio.com</a>, enable WhatsApp, set the webhook URL for incoming messages. Use Twilio’s API to send replies; the Node.js template logic (session, VirtuFit call) stays the same.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Environment variables
            </h2>
            <p className="mb-2 text-[15px] text-[#A09E97]">Set these for the webhook handler:</p>
            <ul className="space-y-1 text-[14px] text-[#A09E97]">
              <li><code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[#A09E97]">VIRTUFIT_BASE_URL</code> — e.g. {baseUrl || 'https://virtufit.xyz'}</li>
              <li><code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[#A09E97]">VIRTUFIT_API_KEY</code> — your VirtuFit API key</li>
              <li><code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[#A09E97]">WHATSAPP_ACCESS_TOKEN</code> — Meta WhatsApp access token</li>
              <li><code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[#A09E97]">WHATSAPP_PHONE_NUMBER_ID</code> — Phone Number ID for sending</li>
              <li><code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[#A09E97]">WEBHOOK_VERIFY_TOKEN</code> — secret for webhook verification (GET)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Webhook URL and verification
            </h2>
            <p className="mb-2 text-[15px] text-[#A09E97]">
              Meta requires verification: <strong>GET</strong> with <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">hub.mode=subscribe</code>, <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">hub.verify_token</code>, <code className="rounded bg-[#2C2C27] px-1 text-[#A09E97]">hub.challenge</code>. Respond with the challenge value if the token matches. The Node.js template includes this handler.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Session management
            </h2>
            <p className="text-[15px] text-[#A09E97]">
              The template uses in-memory sessions (customer ID → step + person image URL). Step 1: wait for person photo. Step 2: wait for product code or image. Step 3: call VirtuFit, send result. In production use Redis or a database.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Error messages (English and Urdu)
            </h2>
            <p className="mb-2 text-[15px] text-[#A09E97]">
              The template includes both languages, e.g. “Something went wrong. Please try again.” / “Kuch galat ho gaya. Dubara koshish karein.” and “Insufficient credits…” / “Credits khatam. Top up karein.”
            </p>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[18px] font-normal tracking-[-0.02em] text-[#F0EFE8]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <FileCode className="h-5 w-5 text-[#D9714A]" />
              Node.js webhook template
            </h2>
            <p className="mb-3 text-[15px] text-[#A09E97]">
              The project includes a ready-to-use template in the repo at <code className="rounded bg-[#2C2C27] px-1.5 py-0.5 text-[13px] text-[#A09E97]">integrations/whatsapp/</code>: <strong className="text-[#F0EFE8]">webhook-handler.js</strong> (Express, Meta Cloud API, session management, VirtuFit call, EN/UR errors) and <strong className="text-[#F0EFE8]">README.md</strong>.
            </p>
            <p className="text-[14px] text-[#A09E97]">
              Run: <code className="rounded bg-[#2C2C27] px-2 py-1 text-[13px] text-[#A09E97]">npm install</code> in that folder, set env vars, then <code className="rounded bg-[#2C2C27] px-2 py-1 text-[13px] text-[#A09E97]">node webhook-handler.js</code>. Expose with HTTPS (e.g. ngrok) and set that URL as the webhook in Meta.
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
