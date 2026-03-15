import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

let connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');
// Koyeb and most managed Postgres require SSL
if (!connectionString.includes('sslmode=') && !connectionString.includes('localhost')) {
  connectionString += connectionString.includes('?') ? '&sslmode=verify-full' : '?sslmode=verify-full';
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'asadalinawaz700@gmail.com';
  const existing = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'Super Admin',
        role: 'superadmin',
      },
    });
    console.log('Created default admin:', adminEmail);
  }

  const plans = [
    { key: 'FREE', name: 'Free', welcomeCredits: 5, features: ['5 credits on signup', 'Virtual try-on API access', 'Standard support'], contactEmail: null as string | null, description: null as string | null },
    { key: 'ENTERPRISE', name: 'Enterprise', welcomeCredits: null, features: ['Custom credits', 'Priority support', 'Dedicated account manager'], contactEmail: 'asadalinawaz700@gmail.com', description: 'Contact us for custom pricing and volume.' },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({
      where: { key: p.key },
      create: { key: p.key, name: p.name, welcomeCredits: p.welcomeCredits ?? undefined, features: p.features, contactEmail: p.contactEmail ?? undefined, description: p.description ?? undefined, status: 'active' },
      update: { name: p.name, welcomeCredits: p.welcomeCredits ?? undefined, features: p.features, contactEmail: p.contactEmail ?? undefined, description: p.description ?? undefined },
    });
  }
  console.log('Plans upserted.');

  const defaultSettings = [
    { key: 'credit_rate_cents_per_credit', value: '20' }, // $0.20 per credit
    { key: 'tier_credits_nano', value: '1' },
    { key: 'tier_credits_basic', value: '1' },
    { key: 'tier_credits_pro', value: '3' },
    { key: 'support_email', value: 'asadalinawaz700@gmail.com' },
    { key: 'support_phone', value: '+923213889791' },
    { key: 'founder_name', value: 'Asad Ali' },
    { key: 'whatsapp_number', value: '923213889791' },
    ...(process.env.NEXT_PUBLIC_APP_URL
      ? [{ key: 'base_api_url', value: process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '') }]
      : []),
  ];
  for (const s of defaultSettings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      create: { key: s.key, value: s.value },
      update: { value: s.value },
    });
  }
  console.log('App settings upserted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
