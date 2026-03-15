import { redirect } from 'next/navigation';
import { getSessionAndValidate } from '@/lib/auth';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { ApiKeysManager } from './ApiKeysManager';

export default async function ApiKeysPage() {
  const validation = await getSessionAndValidate();
  if (!validation.valid) {
    if (validation.deleted) redirect('/login?closed=1');
    redirect('/login');
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#1A1915]">
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-[64px] sm:px-6 lg:px-8">
        <div className="mb-10">
          <ButtonLink
            href="/dashboard"
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="mb-6"
          >
            Dashboard
          </ButtonLink>
          <p className="eyebrow mb-2">API keys</p>
          <h1
            className="text-[28px] font-normal tracking-[-0.025em] text-[#F0EFE8]"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            Manage API keys
          </h1>
          <p className="mt-2 text-[15px] leading-[1.75] text-[#A09E97]">
            Create and delete API keys for authenticating your requests. Copy the key from your dashboard; you can view it again anytime in Settings.
          </p>
        </div>

        <ApiKeysManager />
      </main>
    </div>
  );
}
