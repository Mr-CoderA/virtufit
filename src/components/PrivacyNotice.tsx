import Link from 'next/link';

// Verified 9 Nov 2026: Terms of Use (section 8 covers Content) and Privacy Policy.
export const DECART_TERMS_URL = 'https://decart.ai/terms';
export const DECART_PRIVACY_URL = 'https://decart.ai/privacy-policy';

/** Short notice shown before a visitor uploads an image. */
export function PrivacyNotice({ className = '' }: { className?: string }) {
  return <p className={`privacy-notice ${className}`.trim()}>
    Your photos and generated results are sent to Decart for processing. Under{' '}
    <a href={DECART_TERMS_URL} target="_blank" rel="noreferrer">Decart’s terms</a>, Decart may use them to improve its platform.
    Only upload photos you have the right to use. <Link href="/privacy">Privacy notice</Link>
  </p>;
}
