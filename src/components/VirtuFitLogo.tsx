import Link from 'next/link';
export function VirtuFitLogo({ showTagline = false }: { showTagline?: boolean; size?: 'sm' | 'md' | 'lg' | 'nav' }) {
  return <Link className="vf-wordmark" href="/" aria-label="VirtuFit home"><span className="vf-monogram" aria-hidden="true">V<span>F</span></span><span>VirtuFit{showTagline && <small>The open fitting studio</small>}</span></Link>;
}
export function VirtuFitLogoSvgOnly({ className }: { className?: string }) {
  return <svg viewBox="0 0 100 100" className={className} aria-hidden="true"><rect width="100" height="100" rx="20" fill="var(--vf-accent)"/><path d="M22 25 40 75 58 25M64 75V25H85M64 47H80" stroke="white" strokeWidth="6" fill="none"/></svg>;
}
