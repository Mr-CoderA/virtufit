import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionAndValidate } from '@/lib/auth';
import { paymentsEnabled } from '@/lib/product-mode';
import { DashboardTopUpHistory } from './DashboardTopUpHistory';
import LegacyDashboard from './LegacyDashboard';
export default async function DashboardPage() {
  if (paymentsEnabled()) return <LegacyDashboard/>;
  const account = await getSessionAndValidate();
  if (!account.valid) redirect('/login');
  return <main className="studio-page"><p className="eyebrow">YOUR VIRTUFIT</p><h1>A space for your style.</h1><p className="lead">The studio is open to everyone. Your account is optional, and public try-on never uses your previous credit balance.</p><div className="feature-grid"><article className="studio-panel"><p className="eyebrow">THE FITTING STUDIO</p><h2>A new look, on you.</h2><p>Try the live mirror, point to choose clothes, or create a finished photo. Your saved wardrobe stays in this browser.</p><Link className="studio-cta" href="/">Open the fitting room ↗</Link></article><article className="studio-panel"><p className="eyebrow">YOUR ACCOUNT</p><h2>Make yourself at home.</h2><p>Manage your account details and password. You can use the studio whether you are signed in or signed out.</p><Link className="studio-link" href="/settings">Account settings ↗</Link></article></div><section style={{marginTop:40}}><p className="eyebrow">KEPT FOR YOUR RECORDS</p><h2>Previous payments</h2><p className="lead">New payments are turned off. Existing transactions and balances are retained.</p><DashboardTopUpHistory/></section><section><h2>Building something of your own?</h2><p>VirtuFit is open source. Run your own studio with your own server-side provider key.</p><a className="studio-link" href="https://github.com/Mr-CoderA/virtufit">Explore the source ↗</a></section></main>;
}
