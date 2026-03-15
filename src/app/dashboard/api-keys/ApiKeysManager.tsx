'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Key, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassCard, GlassCardInner } from '@/components/ui/GlassCard';
import { useToast } from '@/components/ui/ToastProvider';
import { brandFetch } from '@/lib/brand-api';

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export function ApiKeysManager() {
  const toast = useToast();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await brandFetch('/api/api-keys', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setKeys(data.apiKeys ?? []);
    } catch {
      toast.error('Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = createName.trim();
    if (!name) {
      toast.warning('Enter a name for the key.');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await brandFetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create API key');
        return;
      }
      setNewKey({ key: data.key, name: data.name });
      setCreateName('');
      setCreateOpen(false);
      load();
      toast.success('API key created. Copy it now — it won’t be shown again.', { duration: 8000 });
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this API key? Any apps using it will stop working.')) return;
    setDeletingId(id);
    try {
      const res = await brandFetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error('Failed to delete API key');
        return;
      }
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success('API key deleted.');
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setDeletingId(null);
    }
  }

  async function copyNewKey() {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey.key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast.success('API key copied to clipboard.');
    } catch {
      toast.error('Could not copy.');
    }
  }

  return (
    <div className="space-y-8">
      {newKey && (
        <GlassCard className="p-7 border-[#D9714A]/30 bg-[#222219]">
          <p className="eyebrow mb-2">New API key — copy now</p>
          <p className="text-[15px] text-[#A09E97] mb-3">
            Store it securely. You can view and copy it again anytime in Settings.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <code className="flex-1 min-w-0 truncate rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#1A1915] px-4 py-3 text-[13px] text-[#F0EFE8] font-mono">
              {newKey.key}
            </code>
            <button
              type="button"
              onClick={copyNewKey}
              className="shrink-0 flex items-center gap-2 rounded-full border border-[rgba(240,239,232,0.14)] bg-[#2C2C27] px-4 py-2.5 text-[13px] font-medium text-[#F0EFE8] hover:bg-[#1A1915] transition-colors"
            >
              {copiedKey ? <Check className="h-4 w-4 text-[#D9714A]" /> : <Copy className="h-4 w-4" />}
              {copiedKey ? 'Copied' : 'Copy'}
            </button>
            <Button variant="secondary" size="sm" onClick={() => setNewKey(null)}>
              Done
            </Button>
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-7 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2
            className="text-[18px] font-normal tracking-[-0.025em] text-[#F0EFE8]"
            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
          >
            Your API keys
          </h2>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Create API key
          </Button>
        </div>

        {createOpen && (
          <form onSubmit={handleCreate} className="mb-8 p-5 rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#1A1915]">
            <label htmlFor="key-name" className="block text-[13px] font-medium text-[#A09E97] mb-2">
              Key name
            </label>
            <input
              id="key-name"
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Production"
              className="input-glass max-w-md mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" loading={createLoading} disabled={createLoading}>
                Create
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-[15px] text-[#65635D]">Loading…</p>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-2xl bg-[#2C2C27] border border-[rgba(240,239,232,0.08)] p-4 mb-4">
              <Key className="h-8 w-8 text-[#65635D]" />
            </div>
            <p className="text-[15px] text-[#A09E97]">No API keys yet.</p>
            <p className="text-[13px] text-[#65635D] mt-1">Create one to authenticate your API requests.</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-6"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Create API key
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(240,239,232,0.08)] bg-[#1A1915] p-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Key className="h-5 w-5 text-[#65635D] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-[#F0EFE8]">{k.name}</p>
                    <p className="text-[13px] font-mono text-[#65635D] truncate">{k.keyPrefix}</p>
                    <p className="text-[11px] text-[#65635D] mt-1">
                      Created {new Date(k.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      {k.lastUsedAt && (
                        <> · Last used {new Date(k.lastUsedAt).toLocaleDateString(undefined, { dateStyle: 'short' })}</>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#A09E97] hover:text-[#D9714A] shrink-0"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => handleDelete(k.id)}
                  disabled={deletingId === k.id}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
