import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
  const from = process.env.EMAIL_FROM ?? 'VirtuFit <onboarding@resend.dev>';
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
