import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/** Verified sender — never use onboarding@resend.dev or other test addresses. */
const DEFAULT_FROM = 'VirtuFit <noreply@virtufit.xyz>';

function getFrom(): string {
  const envFrom = process.env.EMAIL_FROM?.trim();
  if (envFrom && envFrom.endsWith('@virtufit.xyz>')) return envFrom;
  const email = process.env.RESEND_FROM_EMAIL?.trim();
  const name = process.env.RESEND_FROM_NAME?.trim();
  if (email && name && email.endsWith('@virtufit.xyz')) return `${name} <${email}>`;
  return DEFAULT_FROM;
}

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send email via Resend. Never throws — always returns { success, error? }.
 * Log errors but do not crash the server.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: unknown }> {
  const from = getFrom();
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: text ?? undefined,
    });
    if (error) {
      console.error('[Email] Send error:', error);
      return { success: false, error };
    }
    console.log('[Email] Sent to:', to, '| ID:', data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Email] Unexpected error:', message);
    return { success: false, error: err };
  }
}

/** Fire-and-forget: do not await in a way that blocks the response. */
export function sendEmailSafe(params: SendEmailParams): void {
  sendEmail(params).catch((err) => console.error('[Email] Failed:', err instanceof Error ? err.message : err));
}

const DASHBOARD_URL = 'https://virtufit.xyz/dashboard';

/** Welcome email after registration (e.g. after email verification). Fire-and-forget. */
export async function sendWelcomeEmail({ to, name }: { to: string; name: string }): Promise<{ success: boolean; id?: string; error?: unknown }> {
  return sendEmail({
    to,
    subject: 'Welcome to VirtuFit — your 5 free credits are ready',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#1A1915;color:#F0EFE8;">
        <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#F0EFE8;margin:0 0 8px;">
          Welcome to Virtu<span style="color:#D9714A">Fit</span>
        </h1>
        <p style="color:#A09E97;font-size:15px;line-height:1.75;margin:0 0 24px;">
          Hi ${name}, your account is ready.
        </p>
        <div style="background:#222219;border:0.5px solid rgba(240,239,232,0.08);border-radius:16px;padding:24px;margin:0 0 24px;">
          <p style="color:#65635D;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">YOUR CREDITS</p>
          <p style="font-family:Georgia,serif;font-size:36px;color:#F0EFE8;margin:0 0 4px;">5</p>
          <p style="color:#A09E97;font-size:14px;margin:0;">free credits added to your account</p>
        </div>
        <p style="color:#A09E97;font-size:14px;line-height:1.75;margin:0 0 24px;">
          Each credit = 1 virtual try-on generation at 1024px.<br/>
          Top up anytime from $5 — no subscription required.
        </p>
        <a href="${DASHBOARD_URL}"
           style="display:inline-block;background:#F0EFE8;color:#1A1915;border-radius:100px;padding:10px 24px;font-size:14px;font-weight:500;text-decoration:none;">
          Go to dashboard →
        </a>
        <p style="color:#65635D;font-size:12px;margin:32px 0 0;">
          VirtuFit · virtufit.xyz
        </p>
      </div>
    `,
    text: `Welcome to VirtuFit, ${name}! Your account is ready with 5 free credits. Visit ${DASHBOARD_URL} to get started.`,
  });
}

/** Top-up confirmation after successful payment. Fire-and-forget. */
export async function sendTopUpConfirmationEmail({
  to,
  name,
  credits,
  dollars,
}: {
  to: string;
  name: string;
  credits: number;
  dollars: number;
}): Promise<{ success: boolean; id?: string; error?: unknown }> {
  return sendEmail({
    to,
    subject: `${credits} credits added to your VirtuFit account`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#1A1915;color:#F0EFE8;">
        <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#F0EFE8;margin:0 0 8px;">
          Virtu<span style="color:#D9714A">Fit</span>
        </h1>
        <p style="color:#A09E97;font-size:15px;line-height:1.75;margin:0 0 24px;">
          Hi ${name}, your top-up was successful.
        </p>
        <div style="background:#222219;border:0.5px solid rgba(240,239,232,0.08);border-radius:16px;padding:24px;margin:0 0 24px;">
          <p style="color:#65635D;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">CREDITS ADDED</p>
          <p style="font-family:Georgia,serif;font-size:36px;color:#F0EFE8;margin:0 0 4px;">+${credits}</p>
          <p style="color:#A09E97;font-size:14px;margin:0;">for $${dollars} USD</p>
        </div>
        <a href="${DASHBOARD_URL}"
           style="display:inline-block;background:#F0EFE8;color:#1A1915;border-radius:100px;padding:10px 24px;font-size:14px;font-weight:500;text-decoration:none;">
          View dashboard →
        </a>
        <p style="color:#65635D;font-size:12px;margin:32px 0 0;">
          VirtuFit · virtufit.xyz
        </p>
      </div>
    `,
    text: `Hi ${name}, ${credits} credits have been added to your VirtuFit account for $${dollars}. Visit ${DASHBOARD_URL} to use them.`,
  });
}

/** Enterprise inquiry — send to hello@virtufit.xyz. Await so we can confirm to user. */
export async function sendEnterpriseInquiryEmail({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}): Promise<{ success: boolean; id?: string; error?: unknown }> {
  return sendEmail({
    to: 'hello@virtufit.xyz',
    subject: `Enterprise inquiry from ${name}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;">
        <h2 style="font-family:Georgia,serif;font-weight:400;">New enterprise inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p style="background:#f5f5f5;padding:16px;border-radius:8px;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </div>
    `,
    text: `New enterprise inquiry\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
  });
}
