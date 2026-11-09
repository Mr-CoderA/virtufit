import type { Metadata } from 'next';
import Link from 'next/link';
import { DECART_PRIVACY_URL, DECART_TERMS_URL } from '@/components/PrivacyNotice';

export const metadata: Metadata = {
  title: 'Privacy notice · VirtuFit',
  description: 'What VirtuFit sends to Decart when you try something on, and what stays on your device.',
};

export default function PrivacyPage() {
  return <main className="studio-page privacy-page">
    <p className="eyebrow">PRIVACY NOTICE</p>
    <h1>What happens to<br/><em>your photos.</em></h1>
    <p className="lead">VirtuFit uses Decart’s AI models to create try-on images and video. This page explains, in plain terms, what is sent to Decart and what stays with you.</p>

    <article className="studio-panel">
      <h2>Sent to Decart for processing</h2>
      <ul>
        <li><strong>Photo try-on:</strong> when you press Generate, your photo and the garment image go through VirtuFit’s server to Decart. The generated image comes back to your browser.</li>
        <li><strong>Live mirror:</strong> when you start AI, your webcam video and the selected garment image are sent to Decart, and the transformed video comes back. Hand tracking runs in your browser. Microphone audio is off.</li>
      </ul>
    </article>

    <article className="studio-panel">
      <h2>How Decart may use them</h2>
      <p>Decart processes this content under its <a href={DECART_TERMS_URL} target="_blank" rel="noreferrer">Terms of Use</a>. Those terms say Decart may use submitted content, including the generated results, to develop and improve its platform. Decart’s <a href={DECART_PRIVACY_URL} target="_blank" rel="noreferrer">Privacy Policy</a> describes how it handles personal data. VirtuFit does not control what Decart does with content after it is sent.</p>
    </article>

    <article className="studio-panel">
      <h2>Only upload photos you have the right to use</h2>
      <p>Use photos of yourself, or of someone who has agreed to it, and garment images you are allowed to use. Don’t upload anyone else’s photo without their permission.</p>
    </article>

    <article className="studio-panel">
      <h2>What stays with you</h2>
      <ul>
        <li>Your camera stays on your device until you start AI.</li>
        <li>Products you save to your wardrobe are stored in this browser.</li>
        <li>To enforce daily limits, VirtuFit keeps a usage record for each try-on. It does not include your photo or the generated image.</li>
      </ul>
    </article>

    <p>Questions? <Link href="/contact">Contact us</Link>.</p>
  </main>;
}
