import { redirect } from 'next/navigation';
import { getSessionAndValidate } from '@/lib/auth';
import { getBaseApiUrl } from '@/lib/base-api-url';
import { IntegrateHub } from './IntegrateHub';

export default async function IntegratePage() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) redirect('/login?closed=1');
    redirect('/login');
  }

  const baseUrl = await getBaseApiUrl();

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#1A1915]">
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
        <div className="mb-8">
          <p
            className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#D9714A]"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Integrate
          </p>
          <h1
            className="text-[28px] font-normal tracking-[-0.02em] text-[#F0EFE8]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Integration hub
          </h1>
          <p className="mt-2 text-[15px] leading-[1.75] text-[#A09E97]">
            Add VirtuFit virtual try-on to your store. Copy the snippets below — your API key is pre-filled when you paste it above.
          </p>
        </div>
        <IntegrateHub baseUrl={baseUrl} />
      </main>
    </div>
  );
}
