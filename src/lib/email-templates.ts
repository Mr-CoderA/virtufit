import { CONTACT } from '@/config/contact';
import type { ContactSettings } from '@/lib/app-settings';

const BASE_STYLES = {
  body: 'margin:0;padding:0;background:#1A1915;font-family:system-ui,-apple-system,sans-serif;',
  card: 'background:#222219;border-radius:16px;border:0.5px solid rgba(240,239,232,0.08);padding:32px;',
  primary: '#F0EFE8',
  secondary: '#A09E97',
  accent: '#D9714A',
  muted: '#65635D',
};

function wrapHtml(subject: string, content: string, contact?: ContactSettings | null): string {
  const footerEmail = contact?.email ?? CONTACT.supportEmail;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="${BASE_STYLES.body}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1915;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:32px">
          <span style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:${BASE_STYLES.primary};">
            Virtu<span style="color:${BASE_STYLES.accent}">Fit</span>
          </span>
        </td></tr>
        <tr><td style="${BASE_STYLES.card}">
          ${content}
        </td></tr>
        <tr><td style="padding-top:24px;font-size:12px;color:${BASE_STYLES.muted};text-align:center;">
          VirtuFit · Virtual Try-On API<br>
          If you did not request this email, ignore it safely. Questions? ${footerEmail}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function p(html: string, style = '') {
  return `<p style="margin:0 0 16px;color:${BASE_STYLES.primary};font-size:15px;line-height:1.6;${style}">${html}</p>`;
}

function btn(href: string, label: string) {
  return `<p style="margin:24px 0 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:${BASE_STYLES.primary};color:#1A1915;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:500;">${escapeHtml(label)}</a></p>`;
}

export function verifyEmailTemplate({ name, code, contact }: { name: string | null; code: string; contact?: ContactSettings | null }) {
  const subject = 'Your VirtuFit verification code';
  const displayName = name || 'there';
  const codeHtml = `<p style="margin:24px 0 16px;font-size:28px;font-weight:600;letter-spacing:0.2em;color:${BASE_STYLES.primary};font-family:monospace;">${escapeHtml(code)}</p>`;
  const content = `
    ${p(`Hi ${escapeHtml(displayName)},`)}
    ${p('Use this code to verify your email and activate your VirtuFit account:')}
    ${codeHtml}
    ${p(`The code expires in 24 hours. If you didn't create an account, ignore this email.`, `color:${BASE_STYLES.secondary};font-size:13px;`)}
  `;
  const text = `Hi ${displayName},\n\nYour VirtuFit verification code is: ${code}\n\nThe code expires in 24 hours.`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function welcomeTemplate({ name, contact }: { name: string | null; contact?: ContactSettings | null }) {
  const subject = 'Welcome to VirtuFit';
  const displayName = name || 'there';
  const dashboardUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL ?? 'https://virtufit.xyz').replace(/\/+$/, '') + '/dashboard';
  const content = `
    ${p(`Welcome to VirtuFit, ${escapeHtml(displayName)}!`)}
    ${p('Your account is active with 5 free credits.')}
    ${p('Here\'s how to get started:')}
    <ul style="margin:0 0 16px;padding-left:20px;color:${BASE_STYLES.primary};font-size:15px;line-height:1.8;">
      <li>Copy your API key from the dashboard</li>
      <li>Make your first try-on generation</li>
      <li>Integrate into your store</li>
    </ul>
    ${btn(dashboardUrl, 'Go to dashboard →')}
  `;
  const text = `Welcome to VirtuFit, ${displayName}! Your account is active with 5 free credits. Go to ${dashboardUrl} to get started.`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function accountDeletedTemplate({ name, contact }: { name: string | null; contact?: ContactSettings | null }) {
  const subject = 'Your VirtuFit account has been closed';
  const supportEmail = contact?.email ?? CONTACT.supportEmail;
  const content = `
    ${p(`Hi ${escapeHtml(name || 'there')},`)}
    ${p('Your VirtuFit account has been closed.')}
    ${p(`If you believe this was a mistake, contact ${supportEmail}.`)}
    ${p('Your data is retained for 90 days.', `color:${BASE_STYLES.secondary};font-size:13px;`)}
  `;
  const text = `Your VirtuFit account has been closed. Contact ${supportEmail} if this was a mistake. Data retained for 90 days.`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function deletionRequestTemplate({ name, confirmationUrl, contact }: { name: string | null; confirmationUrl: string; contact?: ContactSettings | null }) {
  const subject = 'Confirm account deletion';
  const content = `
    ${p(`Hi ${escapeHtml(name || 'there')},`)}
    ${p('You requested to delete your VirtuFit account. Click the button below to confirm.')}
    ${btn(confirmationUrl, 'Confirm deletion')}
    ${p('This link expires in 1 hour. If you didn\'t request this, ignore this email and your account is safe.', `color:${BASE_STYLES.secondary};font-size:13px;`)}
  `;
  const text = `Confirm account deletion: ${confirmationUrl}\nExpires in 1 hour.`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function accountReactivatedTemplate({
  name,
  credits,
  apiKeyPrefix,
  contact,
}: { name: string | null; credits: number; apiKeyPrefix: string; contact?: ContactSettings | null }) {
  const subject = 'Your VirtuFit account has been reactivated';
  const displayName = name || 'there';
  const supportEmail = contact?.email ?? CONTACT.supportEmail;
  const dashboardUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL ?? 'https://virtufit.xyz').replace(/\/+$/, '') + '/dashboard';
  const content = `
    ${p(`Welcome back, ${escapeHtml(displayName)}!`)}
    ${p('Your account has been successfully reactivated.')}
    ${p('What\'s restored:', `font-weight:600;`)}
    <ul style="margin:0 0 16px;padding-left:20px;color:${BASE_STYLES.primary};font-size:15px;line-height:1.8;">
      <li>Credit balance: ${credits} credits</li>
      <li>API key prefix: ${escapeHtml(apiKeyPrefix)}</li>
      <li>All your usage history</li>
    </ul>
    ${p('Your API key works exactly as before — no changes needed in your integrations.')}
    ${btn(dashboardUrl, 'Go to dashboard →')}
    ${p(`If you did not request this reactivation, contact ${supportEmail} immediately and we will secure your account.`, `color:${BASE_STYLES.secondary};font-size:13px;margin-top:24px;`)}
  `;
  const text = `Welcome back, ${displayName}! Your account has been reactivated. Credits: ${credits}. API key prefix: ${apiKeyPrefix}. Go to ${dashboardUrl}`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function accountRestoredTemplate({ name, contact }: { name: string | null; contact?: ContactSettings | null }) {
  const subject = 'Your VirtuFit account has been restored';
  const loginUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL ?? 'https://virtufit.xyz').replace(/\/+$/, '') + '/login';
  const content = `
    ${p(`Hi ${escapeHtml(name || 'there')},`)}
    ${p('Your VirtuFit account has been restored. You can now log in and use the API again.')}
    ${btn(loginUrl, 'Log in →')}
  `;
  const text = `Your VirtuFit account has been restored. Log in at ${loginUrl}`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function passwordChangedTemplate({ name, contact }: { name: string | null; contact?: ContactSettings | null }) {
  const subject = 'Your VirtuFit password was changed';
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  const supportEmail = contact?.email ?? CONTACT.supportEmail;
  const content = `
    ${p(`Hi ${escapeHtml(name || 'there')},`)}
    ${p(`Your password was changed on ${dateStr} at ${timeStr}.`)}
    ${p(`If this wasn't you, contact ${supportEmail} immediately.`)}
    ${p('Your API keys have NOT been changed.', `color:${BASE_STYLES.secondary};font-size:13px;`)}
  `;
  const text = `Your password was changed on ${dateStr} at ${timeStr}. If this wasn't you, contact ${supportEmail}.`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function creditsAddedTemplate({ name, credits, newBalance, reason, contact }: { name: string | null; credits: number; newBalance: number; reason?: string; contact?: ContactSettings | null }) {
  const subject = 'Credits added to your VirtuFit account';
  const content = `
    ${p(`Hi ${escapeHtml(name || 'there')},`)}
    ${p(`${credits} credit${credits === 1 ? '' : 's'} have been added to your account.`)}
    ${p(`New balance: ${newBalance} credits`)}
    ${reason ? p(`Reason: ${escapeHtml(reason)}`, `color:${BASE_STYLES.secondary};font-size:13px;`) : ''}
  `;
  const text = `${credits} credits added. New balance: ${newBalance}.${reason ? ` Reason: ${reason}` : ''}`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function accountSuspendedTemplate({ name, reason, contact }: { name: string | null; reason?: string; contact?: ContactSettings | null }) {
  const subject = 'Your VirtuFit account has been suspended';
  const supportEmail = contact?.email ?? CONTACT.supportEmail;
  const content = `
    ${p(`Hi ${escapeHtml(name || 'there')},`)}
    ${p('Your VirtuFit account has been temporarily suspended.')}
    ${reason ? p(`Reason: ${escapeHtml(reason)}`, `color:${BASE_STYLES.secondary};`) : p(`Contact ${supportEmail} for details.`)}
    ${p(`Contact ${supportEmail} to resolve this.`)}
  `;
  const text = `Your VirtuFit account has been suspended.${reason ? ` Reason: ${reason}.` : ''} Contact ${supportEmail}.`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function accountUnsuspendedTemplate({ name, contact }: { name: string | null; contact?: ContactSettings | null }) {
  const subject = 'Your VirtuFit account has been restored';
  const loginUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL ?? 'https://virtufit.xyz').replace(/\/+$/, '') + '/login';
  const content = `
    ${p(`Hi ${escapeHtml(name || 'there')},`)}
    ${p('Your VirtuFit account has been restored. You can now log in and use the API again.')}
    ${btn(loginUrl, 'Log in →')}
  `;
  const text = `Your VirtuFit account has been restored. Log in at ${loginUrl}`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function apiKeyRotatedTemplate({ name, keyPrefix, contact }: { name: string | null; keyPrefix: string; contact?: ContactSettings | null }) {
  const subject = 'Your VirtuFit API key was rotated';
  const now = new Date();
  const supportEmail = contact?.email ?? CONTACT.supportEmail;
  const content = `
    ${p(`Hi ${escapeHtml(name || 'there')},`)}
    ${p(`Your API key was rotated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}.`)}
    ${p('Your old key is no longer valid.')}
    ${p(`Your new key prefix: ${escapeHtml(keyPrefix)}`, `font-family:monospace;font-size:13px;`)}
    ${p('Find your full key in your dashboard.')}
    ${p(`If you did not request this, contact ${supportEmail} immediately.`, `color:${BASE_STYLES.accent};`)}
  `;
  const text = `API key rotated. New prefix: ${keyPrefix}. Find full key in dashboard.`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function lowCreditsTemplate({ name, balance, contact }: { name: string | null; balance: number; contact?: ContactSettings | null }) {
  const subject = 'Low credits on your VirtuFit account';
  const dashboardUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL ?? 'https://virtufit.xyz').replace(/\/+$/, '') + '/dashboard';
  const content = `
    ${p(`Hi ${escapeHtml(name || 'there')},`)}
    ${p(`You have ${balance} credit${balance === 1 ? '' : 's'} remaining.`)}
    ${p('Top up now to keep your try-on button working.')}
    ${btn(dashboardUrl, 'Top up credits →')}
  `;
  const text = `You have ${balance} credits remaining. Top up at ${dashboardUrl}`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

export function loginFromNewDeviceTemplate({
  name,
  ip,
  userAgent,
  time,
  contact,
}: { name: string | null; ip: string; userAgent: string; time: string; contact?: ContactSettings | null }) {
  const subject = 'New login to your VirtuFit account';
  const settingsUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL ?? 'https://virtufit.xyz').replace(/\/+$/, '') + '/settings';
  const uaShort = userAgent.length > 80 ? userAgent.slice(0, 77) + '...' : userAgent;
  const supportEmail = contact?.email ?? CONTACT.supportEmail;
  const content = `
    ${p(`Hi ${escapeHtml(name || 'there')},`)}
    ${p('New login detected on your VirtuFit account.')}
    <p style="margin:0 0 8px;color:${BASE_STYLES.secondary};font-size:13px;font-family:monospace;">
      IP: ${escapeHtml(ip)}<br>Time: ${escapeHtml(time)}<br>Device: ${escapeHtml(uaShort)}
    </p>
    ${p('If this was you, no action needed.')}
    ${p('If not you: rotate your API key and change your password immediately.', `color:${BASE_STYLES.accent};`)}
    ${p(`Contact ${supportEmail} immediately if this was not you.`, `color:${BASE_STYLES.secondary};font-size:13px;`)}
    ${btn(settingsUrl, 'Secure my account')}
  `;
  const text = `New login: IP ${ip}, Time ${time}, Device ${uaShort}. If not you, contact ${supportEmail} and secure your account at ${settingsUrl}`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}

/** Notification to founder when someone submits contact form */
export function contactNotificationTemplate(params: {
  name: string;
  email: string;
  brand?: string | null;
  platform?: string | null;
  subject: string;
  message: string;
  contact?: ContactSettings | null;
}) {
  const { name, email, brand, platform, subject, message, contact } = params;
  const subjectLine = `New VirtuFit contact: ${subject} from ${name}`;
  const content = `
    ${p('Name:', `font-weight:600;color:${BASE_STYLES.muted};font-size:12px;`)}
    ${p(escapeHtml(name))}
    ${p('Email:', `font-weight:600;color:${BASE_STYLES.muted};font-size:12px;`)}
    ${p(escapeHtml(email))}
    ${p('Brand:', `font-weight:600;color:${BASE_STYLES.muted};font-size:12px;`)}
    ${p(escapeHtml(brand || 'Not provided'))}
    ${p('Platform:', `font-weight:600;color:${BASE_STYLES.muted};font-size:12px;`)}
    ${p(escapeHtml(platform || 'Not specified'))}
    ${p('Subject:', `font-weight:600;color:${BASE_STYLES.muted};font-size:12px;`)}
    ${p(escapeHtml(subject))}
    ${p('Message:', `font-weight:600;color:${BASE_STYLES.muted};font-size:12px;margin-top:16px;`)}
    <p style="margin:0 0 16px;color:${BASE_STYLES.primary};font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>
    <p style="margin:24px 0 0;font-size:12px;color:${BASE_STYLES.muted};">Reply directly to this email to respond to ${escapeHtml(name)}.</p>
  `;
  const text = `Name: ${name}\nEmail: ${email}\nBrand: ${brand || 'Not provided'}\nPlatform: ${platform || 'Not specified'}\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nReply directly to this email to respond.`;
  return { subject: subjectLine, html: wrapHtml(subjectLine, content, contact), text };
}

/** Confirmation email to person who submitted contact form */
export function contactConfirmationTemplate({ name, email, contact }: { name: string; email: string; contact?: ContactSettings | null }) {
  const subject = 'We got your message — VirtuFit';
  const dashboardUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.FRONTEND_URL ?? 'https://virtufit.xyz').replace(/\/+$/, '') + '/';
  const phoneDisplay = contact?.phone ?? CONTACT.phoneDisplay;
  const content = `
    ${p(`Hi ${escapeHtml(name)},`)}
    ${p(`Thanks for reaching out. We've received your message and will get back to you at ${escapeHtml(email)} within 24 hours.`)}
    ${p(`In the meantime, if it's urgent you can WhatsApp us at ${phoneDisplay}.`)}
    ${btn(dashboardUrl, 'Visit VirtuFit →')}
  `;
  const text = `Hi ${name}, Thanks for reaching out. We've received your message and will get back to you at ${email} within 24 hours. WhatsApp: ${phoneDisplay}.`;
  return { subject, html: wrapHtml(subject, content, contact), text };
}
