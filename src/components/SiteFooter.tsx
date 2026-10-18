import Link from 'next/link';
import { VirtuFitLogo } from './VirtuFitLogo';
export function SiteFooter() {
  return <footer className="site-footer"><div className="site-footer-inner"><div><VirtuFitLogo/><p>A little room for a different look.<br/>Free public try-on, powered by Decart.</p></div><nav aria-label="Footer navigation"><Link href="/">Fitting room</Link><Link href="/docs">Studio guide</Link><Link href="/contact">Contact</Link><a href="https://github.com/Mr-CoderA/virtufit" target="_blank" rel="noreferrer">Build with VirtuFit ↗</a></nav><p className="footer-note">Your camera stays on your device until you start AI.<br/>A visual preview of style, not a measurement of fit.</p></div><div className="site-footer-bottom"><span>VIRTUFIT · THE OPEN FITTING STUDIO</span><span>Try freely. Wear what feels like you.</span></div></footer>;
}
