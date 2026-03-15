import { prisma } from '@/lib/db';

const cache: Record<string, string | null> = {};

export async function getSetting(key: string, fallback: string | null = null): Promise<string | null> {
  if (cache[key] !== undefined) return cache[key] ?? fallback;
  const setting = await prisma.appSetting.findUnique({
    where: { key },
    select: { value: true },
  });
  const value = setting?.value ?? fallback;
  cache[key] = value;
  return value;
}

export type ContactSettings = {
  email: string;
  phone: string;
  founderName: string;
  whatsapp: string;
};

const CONTACT_DEFAULTS: ContactSettings = {
  email: 'asadalinawaz700@gmail.com',
  phone: '+923213889791',
  founderName: 'Asad Ali',
  whatsapp: '923213889791',
};

export async function getContactSettings(): Promise<ContactSettings> {
  const [email, phone, founderName, whatsapp] = await Promise.all([
    getSetting('support_email', CONTACT_DEFAULTS.email),
    getSetting('support_phone', CONTACT_DEFAULTS.phone),
    getSetting('founder_name', CONTACT_DEFAULTS.founderName),
    getSetting('whatsapp_number', CONTACT_DEFAULTS.whatsapp),
  ]);
  return {
    email: email ?? CONTACT_DEFAULTS.email,
    phone: phone ?? CONTACT_DEFAULTS.phone,
    founderName: founderName ?? CONTACT_DEFAULTS.founderName,
    whatsapp: whatsapp ?? CONTACT_DEFAULTS.whatsapp,
  };
}

export async function updateSetting(
  key: string,
  value: string,
  adminEmail: string
): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value, updatedAt: new Date(), updatedBy: adminEmail },
    create: { key, value, updatedAt: new Date(), updatedBy: adminEmail },
  });
  cache[key] = value;
}

export function clearSettingsCache(key: string | null = null): void {
  if (key) delete cache[key];
  else Object.keys(cache).forEach((k) => delete cache[k]);
}
